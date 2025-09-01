// FE: fe/src/context/DataContext.jsx
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { pickAdapter } from '../data/adapter';

const Ctx = createContext(null);

function eq(a, b) {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function needsConfirmRepeatChange(prev, next) {
  const pa = prev || { type: 'never' };
  const pb = next || { type: 'never' };
  if (pa.type !== pb.type) return true;
  const keys = ['interval', 'byDay', 'byMonthDay', 'count', 'until'];
  for (const k of keys) {
    const va = pa[k] ?? null;
    const vb = pb[k] ?? null;
    if (!eq(va, vb)) return true;
  }
  return false;
}

function fmtRepeat(r) {
  const x = r || { type: 'never' };
  if (x.type === 'never') return 'Không lặp';
  if (x.type === 'daily') return 'Hàng ngày';
  if (x.type === 'weekly')
    return Array.isArray(x.byDay) && x.byDay.length
      ? `Hàng tuần (${x.byDay.join(', ')})`
      : 'Hàng tuần';
  if (x.type === 'monthly')
    return Number.isInteger(x.byMonthDay)
      ? `Hàng tháng (ngày ${x.byMonthDay})`
      : 'Hàng tháng';
  if (x.type === 'yearly') return 'Hàng năm';
  return 'Lặp tuỳ chỉnh';
}

export function DataProvider({ children }) {
  // ❗ thay vì giữ adapter cố định, tạo getter để luôn lấy phiên bản mới
  const getAdapter = useCallback(() => pickAdapter(), []);
  const [tasksByDate, setTasksByDate] = useState({});

  // nếu token đổi (app bắn 'authChange'), bạn có thể reset/làm sạch cache nếu muốn
  useEffect(() => {
    const onAuth = () => {
      // tuỳ ý: xoá cache local khi chuyển mode guest/server
      // setTasksByDate({});
    };
    window.addEventListener('authChange', onAuth);
    return () => window.removeEventListener('authChange', onAuth);
  }, []);

  const getTasksForDate = (dateKey) => tasksByDate[dateKey] || [];

  // ✅ Thêm getTask để App.jsx gọi
  const getTask = (dateKey, lineIdx) => {
    const list = getTasksForDate(dateKey);
    return list[lineIdx] || null;
  };

  const setDay = (dateKey, list) =>
    setTasksByDate((p) => ({ ...p, [dateKey]: list }));

  const loadRange = async (fromKey, toKey) => {
    const adapter = getAdapter();
    try {
      const rows = await adapter.listRange(fromKey, toKey);
      const grouped = {};
      (rows || []).forEach((t) => {
        const k = t.due_date;
        (grouped[k] = grouped[k] || []).push(t);
      });
      setTasksByDate(grouped);
    } catch (e) {
      // nếu 401/không token → giữ nguyên local (guest)
      console.warn('loadRange fallback (guest/local):', e?.message || e);
    }
  };

  const updateMeta = async (dateKey, lineIdx, patch) => {
    const adapter = getAdapter();
    const list = getTasksForDate(dateKey).slice();
    const cur = list[lineIdx] || {};
    const textNext = (patch?.text ?? cur.text ?? '').trim();

    if ('repeat_info' in patch) {
      const prevR = cur.repeat_info || { type: 'never' };
      const nextR = patch.repeat_info || { type: 'never' };
      if (needsConfirmRepeatChange(prevR, nextR)) {
        const ok = window.confirm(
          `Xác nhận đổi lặp:\n\n${fmtRepeat(prevR)}  →  ${fmtRepeat(nextR)}\n\nBạn có chắc muốn áp dụng?`
        );
        if (!ok) return;
      }
    }

    try {
      if (!cur.id && textNext) {
        // tạo mới
        const created = await adapter.createTask({
          due_date: dateKey,
          text: textNext,
          notes: patch?.notes ?? cur.notes ?? '',
          is_done: patch?.is_done ?? cur.is_done ?? false,
          color: patch?.color ?? cur.color ?? '',
          subtasks: patch?.subtasks ?? cur.subtasks ?? [],
          attachments: patch?.attachments ?? cur.attachments ?? [],
          repeat_info: patch?.repeat_info ?? cur.repeat_info ?? { type: 'never' },
          reminder_info: patch?.reminder_info ?? cur.reminder_info ?? null,
          links: patch?.links ?? cur.links ?? [],
        });
        list[lineIdx] = created || { ...cur, ...patch, text: textNext };
        setDay(dateKey, list);
        return;
      }

      if (cur.id) {
        // cập nhật
        const updated = await adapter.updateTask(cur.id, patch);
        list[lineIdx] = updated || { ...cur, ...patch };
        setDay(dateKey, list);
      } else {
        // local-only (guest)
        list[lineIdx] = { ...cur, ...patch };
        setDay(dateKey, list);
      }
    } catch (e) {
      console.warn('updateMeta fallback (guest/local):', e?.message || e);
      // Fallback local để không rơi lỗi UI khi chưa login
      if (!cur.id && textNext) {
        list[lineIdx] = {
          ...cur,
          ...patch,
          text: textNext,
          // gán id tạm để UI đỡ nhảy (không đẩy server)
          id: cur.id || undefined,
        };
      } else {
        list[lineIdx] = { ...cur, ...patch };
      }
      setDay(dateKey, list);
    }
  };

  const removeTask = async (dateKey, lineIdx) => {
    const adapter = getAdapter();
    const list = getTasksForDate(dateKey);
    const cur = list[lineIdx];
    const next = list.slice();

    try {
      if (cur?.id) await adapter.deleteTask(cur.id);
      next.splice(lineIdx, 1);
      setDay(dateKey, next);
    } catch (e) {
      console.warn('removeTask fallback (guest/local):', e?.message || e);
      next.splice(lineIdx, 1);
      setDay(dateKey, next);
    }
  };

  const toggleDone = async (dateKey, lineIdx) => {
    const adapter = getAdapter();
    const list = getTasksForDate(dateKey);
    const cur = list[lineIdx];
    if (!cur) return;

    try {
      const updated = cur.id
        ? await adapter.updateTask(cur.id, { is_done: !cur.is_done, done: !cur.is_done })
        : null;

      const next = list.slice();
      next[lineIdx] = updated || { ...cur, is_done: !cur.is_done };
      setDay(dateKey, next);
    } catch (e) {
      console.warn('toggleDone fallback (guest/local):', e?.message || e);
      const next = list.slice();
      next[lineIdx] = { ...cur, is_done: !cur.is_done };
      setDay(dateKey, next);
    }
  };

  const compactDay = (dateKey) => {
    const compact = (getTasksForDate(dateKey) || []).filter(
      (t) => (t?.text || '').trim() !== ''
    );
    setDay(dateKey, compact);
  };

  const moveTaskToDate = async (dateKey, lineIdx, targetKey) => {
    const adapter = getAdapter();
    const list = getTasksForDate(dateKey);
    const cur = list[lineIdx];
    if (!cur) return;

    try {
      const updated = cur.id
        ? await adapter.updateTask(cur.id, { due_date: targetKey })
        : null;

      const from = list.slice();
      from.splice(lineIdx, 1);
      const to = (tasksByDate[targetKey] || []).slice();
      to.push(updated || { ...cur, due_date: targetKey });

      setTasksByDate((prev) => ({
        ...prev,
        [dateKey]: from,
        [targetKey]: to,
      }));
    } catch (e) {
      console.warn('moveTaskToDate fallback (guest/local):', e?.message || e);
      const from = list.slice();
      from.splice(lineIdx, 1);
      const to = (tasksByDate[targetKey] || []).slice();
      to.push({ ...cur, due_date: targetKey });
      setTasksByDate((prev) => ({
        ...prev,
        [dateKey]: from,
        [targetKey]: to,
      }));
    }
  };

  const duplicateTask = async (dateKey, lineIdx) => {
    const adapter = getAdapter();
    const list = getTasksForDate(dateKey);
    const cur = list[lineIdx];
    if (!cur) return;

    try {
      const created = cur.id
        ? await adapter.createTask({
            ...cur,
            id: undefined,
            due_date: dateKey,
            text: cur.text || '',
          })
        : null;

      const next = list.slice();
      next.splice(lineIdx + 1, 0, created || { ...cur, id: undefined });
      setDay(dateKey, next);
    } catch (e) {
      console.warn('duplicateTask fallback (guest/local):', e?.message || e);
      const next = list.slice();
      next.splice(lineIdx + 1, 0, { ...cur, id: undefined });
      setDay(dateKey, next);
    }
  };

  const value = useMemo(
    () => ({
      tasksByDate,
      tasks: tasksByDate,
      getTasksForDate,
      getTask,
      loadRange,
      updateMeta,
      removeTask,
      toggleDone,
      compactDay,
      moveTaskToDate,
      duplicateTask,
    }),
    [tasksByDate]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);
