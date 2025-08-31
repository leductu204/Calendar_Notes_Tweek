// src/context/DataContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import * as API from '../api';
import { occursOn } from '../lib/rrule-lite';

const DataContext = createContext();
const MS_DAY = 86400000;

// Helper: token hợp lệ
const hasValidToken = () => {
  try {
    const t = API.storage.getToken();
    return !!(t && t !== 'null' && t !== 'undefined');
  } catch { return false; }
};

const mid = (d) => { const x = new Date(d); x.setHours(12,0,0,0); return x; };
const ymd = (d) => mid(d).toISOString().slice(0,10);
const keyOf = (d) => ymd(d);

function normalizeRow(row) {
  if (!row || typeof row !== 'object') {
    return {
      id: null, text: '', is_done: false, color: '', notes: '',
      repeat_info: { type: 'never' }, reminder_info: null, share_info: {},
      links: [], subtasks: [], attachments: [],
      display_order: 0, due_date: null,
    };
  }
  return {
    id: row.id ?? null,
    text: row.text ?? '',
    is_done: !!(row.is_done ?? row.done),
    color: row.color ?? '',
    notes: row.notes ?? '',
    repeat_info: row.repeat_info ?? row.repeat ?? { type: 'never' },
    reminder_info: row.reminder_info ?? null,
    share_info: row.share_info ?? {},
    links: row.links ?? [],
    subtasks: row.subtasks ?? [],
    attachments: row.attachments ?? [],
    display_order: row.display_order ?? 0,
    due_date: row.due_date ?? null,
  };
}

function normalizePatch(patch) {
  const out = { ...patch };
  if ('done' in out && !('is_done' in out)) {
    out.is_done = !!out.done;
    delete out.done;
  }
  if ('repeat' in out && !('repeat_info' in out)) {
    out.repeat_info = out.repeat;
    delete out.repeat;
  }
  return out;
}

function ensureTaskAt(dayArray, lineIdx) {
  const cur = dayArray[lineIdx];
  if (typeof cur === 'object' && cur !== null) return cur;
  const blank = normalizeRow({ text: typeof cur === 'string' ? cur : '' });
  dayArray[lineIdx] = blank;
  return blank;
}

function makeEmptyDaysMap(from, to) {
  const map = {};
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + MS_DAY)) {
    map[ymd(d)] = [];
  }
  return map;
}

export function DataProvider({ children }) {
  const [tasksByDate, setTasksByDate] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasValidToken());
  const [loading, setLoading] = useState(true);
  const [activeCalendarId, setActiveCalendarId] = useState(() => API.calendars.getActiveCalendarId());

  // ✅ Chỉ dùng server khi có token + có calendar
  const useServer = isLoggedIn && !!activeCalendarId;

  // Lắng nghe login/logout & đổi calendar
  const updateUserStatus = useCallback(() => {
    setIsLoggedIn(hasValidToken());
    setActiveCalendarId(API.calendars.getActiveCalendarId());
    setTasksByDate({});
  }, []);
  useEffect(() => {
    const handleCalendarChange = () => {
      setActiveCalendarId(API.calendars.getActiveCalendarId());
      setTasksByDate({});
    };
    window.addEventListener('authChange', updateUserStatus);
    window.addEventListener('activeCalendarChanged', handleCalendarChange);
    return () => {
      window.removeEventListener('authChange', updateUserStatus);
      window.removeEventListener('activeCalendarChanged', handleCalendarChange);
    };
  }, [updateUserStatus]);

  // Prefetch ±4 tuần quanh dãy ngày đang xem
  const loadWeekData = useCallback(async (weekDays) => {
    if (!weekDays || weekDays.length === 0) return;
    setLoading(true);

    const minDay = mid(weekDays[0]);
    const maxDay = mid(weekDays[weekDays.length - 1]);
    const from = new Date(minDay.getTime() - 28 * MS_DAY);
    const to   = new Date(maxDay.getTime() + 28 * MS_DAY);

    try {
      if (useServer) {
        const items = await API.tasks.serverApi.listRange(activeCalendarId, ymd(from), ymd(to));
        const base = makeEmptyDaysMap(from, to);
        for (const t of items || []) {
          const k = t.due_date?.slice(0,10);
          if (!k) continue;
          base[k] = base[k] || [];
          base[k].push(t);
        }
        Object.keys(base).forEach(k => {
          base[k].sort((a,b) =>
            (a.display_order ?? 0) - (b.display_order ?? 0) || (a.id ?? 0) - (b.id ?? 0)
          );
        });
        setTasksByDate(prev => ({ ...prev, ...base }));
      } else {
        const localAll = API.tasks.localApi.listAll();
        const base = makeEmptyDaysMap(from, to);
        Object.keys(localAll || {}).forEach(k => { base[k] = localAll[k]; });
        setTasksByDate(prev => ({ ...prev, ...base }));
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      // Fallback sang local nếu server lỗi/401
      try {
        const base = makeEmptyDaysMap(from, to);
        const localAll = API.tasks.localApi.listAll();
        Object.keys(localAll || {}).forEach(k => { base[k] = localAll[k]; });
        setTasksByDate(prev => ({ ...prev, ...base }));
        if (String(error).includes('401') || String(error).includes('Token')) {
          API.auth?.logout?.();
          setIsLoggedIn(false);
        }
      } catch (e2) {
        console.warn('Fallback local failed:', e2);
      }
    } finally {
      setLoading(false);
    }
  }, [useServer, activeCalendarId]);

  const getTasksForDate = useCallback((dateKey) => {
    const dayRaw = tasksByDate[dateKey];
    const base = Array.isArray(dayRaw) ? dayRaw.map(normalizeRow) : [];

    // Thêm các bản xuất hiện do repeat (ảo, không ghi DB)
    const targetDate = new Date(`${dateKey}T12:00:00`);
    const extras = [];

    Object.entries(tasksByDate).forEach(([k, arr]) => {
      (arr || []).forEach((t) => {
        const row = normalizeRow(t);
        const rule = row.repeat_info || { type: 'never' };
        if (!rule || rule.type === 'never') return;

        const baseKey = (t.due_date && t.due_date.slice(0,10)) || k;
        if (baseKey === dateKey) return;
        const baseDate = new Date(`${baseKey}T12:00:00`);
        if (targetDate < baseDate) return;

        if (occursOn(baseDate, targetDate, rule)) {
          extras.push(normalizeRow({
            ...t,
            due_date: dateKey,
            _virtual: true,
          }));
        }
      });
    });

    const merged = [...base, ...extras];
    merged.sort((a, b) =>
      (a.display_order ?? 0) - (b.display_order ?? 0) ||
      (a.id ?? 0) - (b.id ?? 0)
    );
    return merged;
  }, [tasksByDate]);

  const getTask = useCallback((dateKey, lineIdx) => {
    const day = tasksByDate[dateKey];
    if (!Array.isArray(day)) return normalizeRow();
    return normalizeRow(day[lineIdx]);
  }, [tasksByDate]);

  // Thu gọn trailing empty (UI mượt) – không đụng DB
  const compactDay = useCallback((dateKey) => {
    setTasksByDate(prev => {
      const day = Array.isArray(prev[dateKey]) ? [...prev[dateKey]] : [];
      while (day.length && !((day[day.length-1]?.text || '').trim())) {
        const last = day[day.length - 1];
        if (last && last.id) break; // có id (server) thì không cắt
        day.pop();
      }
      return { ...prev, [dateKey]: day };
    });
  }, []);

  const updateMeta = useCallback(async (dateKey, lineIdx, patch) => {
    const normPatch = normalizePatch(patch);

    let optimisticId = null;
    setTasksByDate(prev => {
      const day = Array.isArray(prev[dateKey]) ? [...prev[dateKey]] : [];
      const current = ensureTaskAt(day, lineIdx);
      optimisticId = current.id ?? null;
      day[lineIdx] = { ...current, ...normPatch };
      return { ...prev, [dateKey]: day };
    });

    try {
      if (useServer) {
        if (!optimisticId) {
          await API.tasks.serverApi.createTask({
            calendar_id: parseInt(activeCalendarId, 10),
            due_date: dateKey,
            display_order: lineIdx,
            ...normPatch,
          });
        } else {
          await API.tasks.serverApi.updateTask(optimisticId, normPatch);
        }
        const refreshedRange = await API.tasks.serverApi.listRange(activeCalendarId, dateKey, dateKey);
        const day = (refreshedRange || []).filter(t => t.due_date?.slice(0,10) === dateKey)
          .sort((a,b) => (a.display_order ?? 0) - (b.display_order ?? 0) || (a.id ?? 0) - (b.id ?? 0));
        setTasksByDate(prev => ({ ...prev, [dateKey]: day }));
      } else {
        // luôn lưu local khi không dùng server (kể cả đã đăng nhập nhưng chưa có calendar)
        const before = API.tasks.localApi.getDayTasks(dateKey) || [];
        if (!before[lineIdx]) {
          API.tasks.localApi.insertTask(dateKey, lineIdx, {
            text: '', is_done: false, color: '', notes: '', repeat_info: { type: 'never' },
          });
        }
        API.tasks.localApi.updateTask(dateKey, lineIdx, normPatch);
        const updated = API.tasks.localApi.getDayTasks(dateKey);
        setTasksByDate(prev => ({ ...prev, [dateKey]: updated }));
      }
    } catch (err) {
      console.error('updateMeta failed:', err);
    }
  }, [useServer, activeCalendarId]);

  const removeTask = useCallback(async (dateKey, lineIdx) => {
    try {
      if (useServer) {
        const t = (tasksByDate[dateKey] || [])[lineIdx];
        if (t?.id) await API.tasks.serverApi.deleteTask(t.id);
        const refreshedRange = await API.tasks.serverApi.listRange(activeCalendarId, dateKey, dateKey);
        const day = (refreshedRange || []).filter(x => x.due_date?.slice(0,10) === dateKey)
          .sort((a,b) => (a.display_order ?? 0) - (b.display_order ?? 0) || (a.id ?? 0) - (b.id ?? 0));
        setTasksByDate(prev => ({ ...prev, [dateKey]: day }));
      } else {
        API.tasks.localApi.removeTask(dateKey, lineIdx);
        const updated = API.tasks.localApi.getDayTasks(dateKey);
        setTasksByDate(prev => ({ ...prev, [dateKey]: updated }));
      }
    } catch (e) {
      console.error('removeTask failed:', e);
    }
  }, [useServer, tasksByDate, activeCalendarId]);

  const toggleDone = useCallback(async (dateKey, lineIdx) => {
    const t = (tasksByDate[dateKey] || [])[lineIdx];
    const next = !(t?.is_done ?? t?.done ?? false);
    await updateMeta(dateKey, lineIdx, { is_done: next });
  }, [tasksByDate, updateMeta]);

  const value = useMemo(() => ({
    loading,
    isLoggedIn,
    tasks: tasksByDate,
    loadWeekData,
    getTasksForDate,
    getTask,
    updateMeta,
    toggleDone,
    removeTask,
    compactDay,
  }), [loading, isLoggedIn, tasksByDate, loadWeekData, getTasksForDate, getTask, updateMeta, toggleDone, removeTask, compactDay]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
