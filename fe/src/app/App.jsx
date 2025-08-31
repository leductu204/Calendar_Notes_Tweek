// src/app/App.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../components/layout/Header.jsx';
import CalendarGrid from '../components/calendar/CalendarGrid.jsx';
import SomedaySection from '../components/someday/SomedaySection.jsx';
import SearchModal from '../components/modals/SearchModal.jsx';
import TaskModal from '../components/modals/TaskModal.jsx';
import AuthModal from '../components/modals/AuthModal.jsx';
import { UiProvider } from '../context/UiContext.jsx';
import { DataProvider, useData } from '../context/DataContext.jsx';
import { useWeek } from '../hooks/useWeek.js';
import CalendarSettingsModal from '../components/modals/CalendarSettingsModal.jsx';
import AccountModal from '../components/modals/AccountModal.jsx';
import * as API from '../api';

// Helper: token hợp lệ (không tính 'null'/'undefined' string)
const hasValidToken = () => {
  try {
    const t = API.storage.getToken();
    return !!(t && t !== 'null' && t !== 'undefined');
  } catch { return false; }
};

const addDays = (date, d = 0) => {
  const x = new Date(date);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() + d);
  return x;
};
const endOfWeekMonSun = (date) => {
  const x = new Date(date);
  const dow = x.getDay();
  const toSun = (7 - dow) % 7;
  x.setDate(x.getDate() + toSun);
  x.setHours(12, 0, 0, 0);
  return x;
};
const keyOf = (d) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

function AppShell() {
  const { days, prevWeek, nextWeek } = useWeek();
  const { tasks, getTask, getTasksForDate, updateMeta, removeTask } = useData();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskInfo, setActiveTaskInfo] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [showCalSettings, setShowCalSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const [calendars, setCalendars] = useState([]);
  const [activeCalendarId, setActiveCalendarId] = useState(() => API.calendars.getActiveCalendarId());

  // 🔐 Trạng thái đăng nhập rõ ràng
  const [authed, setAuthed] = useState(() => hasValidToken());

  // Lắng nghe thay đổi token
  const [authVer, setAuthVer] = useState(0);
  useEffect(() => {
    const onAuth = () => {
      setAuthVer(v => v + 1);
      setAuthed(hasValidToken());
    };
    window.addEventListener('authChange', onAuth);
    return () => window.removeEventListener('authChange', onAuth);
  }, []);

  useEffect(() => {
    // Không có token hợp lệ → bảo đảm về guest
    if (!hasValidToken()) {
      setAuthed(false);
      setCalendars([]);
      setActiveCalendarId(null);
      return;
    }
    API.calendars.list().then(list => {
      setCalendars(list || []);
      const stored = API.calendars.getActiveCalendarId();
      const nextId = stored || (list && list[0]?.id) || null;
      if (nextId) {
        setActiveCalendarId(String(nextId));
        API.calendars.setActiveCalendarId(String(nextId));
      }
    }).catch(() => {
      // BE không sẵn sàng → về guest để nhập được ngay
      setAuthed(false);
      setCalendars([]);
      setActiveCalendarId(null);
      try { window.dispatchEvent(new Event('authChange')); } catch {}
    });
  }, [authVer]);

  // === NHẬN TOKEN SAU KHI GOOGLE REDIRECT VỀ FE ===
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    if (token) {
      API.auth.setToken(token);
      try { setUser(JSON.parse(userJson)); } catch { setUser(null); }

      // Clear query string (không reload)
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());

      // Tải lại calendars
      API.calendars.list().then(list => {
        setCalendars(list || []);
        const nextId = API.calendars.getActiveCalendarId() || list?.[0]?.id || null;
        if (nextId) setActiveCalendarId(String(nextId));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!activeCalendarId) return;
    API.calendars.setActiveCalendarId(String(activeCalendarId));
    window.dispatchEvent(new Event('activeCalendarChanged'));
  }, [activeCalendarId]);

  const activeCalendar = calendars.find(c => String(c.id) === String(activeCalendarId)) || null;

  const handleCreateCalendar = async ({ type, name }) => {
    const created = await API.calendars.create({ type, name });
    const list = await API.calendars.list();
    setCalendars(list || []);
    const nextId = created?.id || list?.[0]?.id || null;
    if (nextId) setActiveCalendarId(String(nextId));
  };

  const handleSwitchCalendar = (id) => {
    setActiveCalendarId(String(id));
  };

  const handleAuthSuccess = ({ token, user }) => {
    if (token) API.auth.setToken(token);
    setUser(user || null);
    API.calendars.list().then(list => {
      setCalendars(list || []);
      const nextId = API.calendars.getActiveCalendarId() || list?.[0]?.id || null;
      if (nextId) setActiveCalendarId(String(nextId));
    }).catch(() => {});
    setShowAuth(false);
  };

  const handleLogout = () => {
    API.auth.logout();
    setUser(null);
    setCalendars([]);
    setActiveCalendarId(null);
  };

  const handleUpdateUser = () => {};

  const somedayApiRef = useRef(null);
  const calendarApiRef = useRef(null);

  const openTaskDetail = useCallback((payload) => {
    if (payload?.type === 'someday') {
      const taskData = {
        text: payload.text || '',
        is_done: !!payload.done,
        color: payload.color || '',
        notes: payload.notes || '',
        date: null,
        subtasks: payload.subtasks || [],
        attachments: payload.attachments || [],
        repeat_info: payload.repeat_info || payload.repeat || { type: 'never' },
        reminder_info: payload.reminder_info || payload.reminder || null,
        share_info: payload.share_info || payload.share || { enabled: false },
        links: payload.links || [],
      };
      setActiveTaskInfo({ payload, data: taskData });
    } else {
      const taskData = getTask(payload.dateKey, payload.lineIdx);
      setActiveTaskInfo({ payload, data: { ...taskData, date: payload.date || new Date(payload.dateKey) } });
    }
  }, [getTask]);

  const closeTaskDetail = useCallback(() => setActiveTaskInfo(null), []);

  const moveTaskToDateLocal = useCallback((fromDateKey, lineIdx, targetDate) => {
    const targetKey = keyOf(targetDate);
    const data = getTask(fromDateKey, lineIdx);
    removeTask(fromDateKey, lineIdx);
    const targetIndex = (getTasksForDate(targetKey)?.length || 0);
    const patch = {
      text: data.text || '',
      notes: data.notes || '',
      color: data.color || null,
      subtasks: data.subtasks || [],
      attachments: data.attachments || [],
      repeat_info: data.repeat_info || { type: 'never' },
      reminder_info: data.reminder_info || null,
      share_info: data.share_info || {},
      links: data.links || [],
    };
    updateMeta(targetKey, targetIndex, patch);
  }, [getTask, getTasksForDate, removeTask, updateMeta]);

  const duplicateTaskLocal = useCallback((dateKey, lineIdx) => {
    const data = getTask(dateKey, lineIdx);
    const idx = (getTasksForDate(dateKey)?.length || 0);
    const patch = {
      text: data.text || '',
      notes: data.notes || '',
      color: data.color || null,
      subtasks: data.subtasks || [],
      attachments: data.attachments || [],
      repeat_info: data.repeat_info || { type: 'never' },
      reminder_info: data.reminder_info || null,
      share_info: data.share_info || {},
      links: data.links || [],
    };
    updateMeta(dateKey, idx, patch);
  }, [getTask, getTasksForDate, updateMeta]);

  const handleUpdateTask = useCallback((updatedData) => {
    if (!activeTaskInfo) return;
    const p = activeTaskInfo.payload;
    const currentData = activeTaskInfo.data || {};
    const newData = { ...currentData, ...updatedData };

    if (updatedData && updatedData.date instanceof Date) {
      const target = new Date(updatedData.date);
      target.setHours(12, 0, 0, 0);
      if (p.type === 'someday') {
        somedayApiRef.current?.moveSomedayToDate?.(p.columnId, p.rowIndex, target);
      } else {
        if (keyOf(target) !== p.dateKey) {
          moveTaskToDateLocal(p.dateKey, p.lineIdx, target);
        }
      }
      calendarApiRef.current?.gotoDate?.(target);
      window.dispatchEvent(new CustomEvent('app:gotoDate', { detail: target }));
    }

    const patch = { ...updatedData };
    if ('title' in patch && !('text' in patch)) { patch.text = patch.title; delete patch.title; }
    if ('repeat' in patch && !('repeat_info' in patch)) { patch.repeat_info = patch.repeat; delete patch.repeat; }
    if ('reminder' in patch && !('reminder_info' in patch)) { patch.reminder_info = patch.reminder; delete patch.reminder; }
    if ('share' in patch && !('share_info' in patch)) { patch.share_info = patch.share; delete patch.share; }

    if (p.type === 'someday') {
      somedayApiRef.current?.updateSomedayMeta?.(p.columnId, p.rowIndex, patch);
    } else {
      updateMeta(p.dateKey, p.lineIdx, patch);
    }

    setActiveTaskInfo(prev => prev ? ({ ...prev, data: newData }) : null);
  }, [activeTaskInfo, updateMeta, moveTaskToDateLocal]);

  const handleDeleteTask = useCallback(() => {
    if (!activeTaskInfo) return;
    const p = activeTaskInfo.payload;
    if (p.type === 'someday') {
      somedayApiRef.current?.deleteSomedayTask?.(p.columnId, p.rowIndex);
    } else {
      removeTask(p.dateKey, p.lineIdx);
    }
    closeTaskDetail();
  }, [activeTaskInfo, removeTask, closeTaskDetail]);

  const moveToDateHandler = useCallback((targetDate) => {
    if (!activeTaskInfo) return;
    const p = activeTaskInfo.payload;
    if (p.type === 'someday') {
      somedayApiRef.current?.moveSomedayToDate?.(p.columnId, p.rowIndex, targetDate);
    } else {
      moveTaskToDateLocal(p.dateKey, p.lineIdx, targetDate);
    }
    calendarApiRef.current?.gotoDate?.(targetDate);
    window.dispatchEvent(new CustomEvent('app:gotoDate', { detail: targetDate }));
    closeTaskDetail();
  }, [activeTaskInfo, moveTaskToDateLocal, closeTaskDetail]);

  const handleMoveToTomorrow = useCallback(() => {
    if (!activeTaskInfo) return;
    const base = activeTaskInfo.data?.date || new Date();
    moveToDateHandler(addDays(base, 1));
  }, [activeTaskInfo, moveToDateHandler]);

  const handleMoveToNextWeek = useCallback(() => {
    if (!activeTaskInfo) return;
    const base = activeTaskInfo.data?.date || new Date();
    moveToDateHandler(addDays(base, 7));
  }, [activeTaskInfo, moveToDateHandler]);

  const handleMoveToSomeday = useCallback(() => {
    if (!activeTaskInfo || activeTaskInfo.payload.type === 'someday') return;
    const { dateKey, lineIdx } = activeTaskInfo.payload;
    const data = getTask(dateKey, lineIdx);
    somedayApiRef.current?.createSomedayTask?.(0, data);
    removeTask(dateKey, lineIdx);
    closeTaskDetail();
  }, [activeTaskInfo, getTask, removeTask, closeTaskDetail]);

  const handleDuplicate = useCallback(() => {
    if (!activeTaskInfo) return;
    const p = activeTaskInfo.payload;

    if (p.type === 'someday') {
      // Nhân bản ngay dưới dòng hiện tại
      const data = activeTaskInfo.data || {};
      const row = {
        ...data,
        text: data.text || '',
        done: !!(data.done ?? data.is_done),
        color: data.color || '',
        notes: data.notes || '',
        subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        repeat_info: data.repeat_info || { type: 'never' },
        reminder_info: data.reminder_info || null,
        share_info: data.share_info || { enabled: false },
        links: Array.isArray(data.links) ? data.links : [],
      };

      // Truyền vị trí chèn (sau rowIndex hiện tại)
      somedayApiRef.current?.createSomedayTask?.(p.columnId, row, p.rowIndex);
    } else {
      // Lịch tuần: nhân bản như cũ
      duplicateTaskLocal(p.dateKey, p.lineIdx);
    }
  }, [activeTaskInfo, duplicateTaskLocal]);

  const handleAddAttachment = useCallback(() => {}, []);

  const anyModalOpen =
    !!activeTaskInfo ||
    isSearchOpen ||
    (showAuth && !user) ||
    showCalSettings ||
    showAccount;

  useEffect(() => {
    if (anyModalOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [anyModalOpen]);

  useEffect(() => {
    // Phòng khi 'modal-open' bị kẹt do hot-reload / phiên cũ
    document.body.classList.remove('modal-open');
    // Gỡ inline style lock-scroll nếu còn sót từ phiên trước
    try {
      const keys = ['position','top','left','right','width','overflow','paddingRight'];
      keys.forEach(k => { document.body.style[k] = ''; });
    } catch {}
  }, []);

  // === Scope cho Someday (guest | user | cal:<id>) ===
  const somedayScope = authed
    ? (activeCalendarId ? `cal:${activeCalendarId}` : 'user')
    : 'guest';

  // ❌ ĐÃ BỎ: không xoá Someday guest nữa (để tránh mất dữ liệu khi login)

  // ➜ Migrate: guest → scope hiện tại khi đăng nhập
  useEffect(() => {
    if (!authed) return;
    const scope = activeCalendarId ? `cal:${activeCalendarId}` : 'user';
    try {
      const guestKey = 'someday_tasks_v2:guest';
      const dstKey   = `someday_tasks_v2:${scope}`;

      const guestRaw = localStorage.getItem(guestKey);
      if (!guestRaw) return;

      const dstRaw = localStorage.getItem(dstKey);
      const guest  = JSON.parse(guestRaw || '[]');
      const dst    = JSON.parse(dstRaw || '[]');

      const merged = [...dst];
      for (const t of guest) {
        if (!merged.some(x => x && t && x.id === t.id)) merged.push(t);
      }

      localStorage.setItem(dstKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
    } catch (e) {
      console.warn('Migrate Someday guest → signed-in failed', e);
    }
  }, [authed, activeCalendarId]);
   useEffect(() => {
  const isTaskInput = (el) =>
    el?.classList?.contains('calendar-task-input') ||
    el?.classList?.contains('someday-task-input');

  const getRow = (el) => el?.closest?.('.task-line-row, .someday-row');

  const commitRow = (rowEl) => {
    if (!rowEl) return;
    // Đặt cờ khóa
    rowEl.classList.add('is-committed');
    rowEl.classList.add('just-committed');
    // Bỏ cờ chống-dính sau 160ms
    setTimeout(() => rowEl.classList.remove('just-committed'), 160);
  };

  // Enter -> commit (nếu có nội dung)
  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !isTaskInput(el)) return;
    if (!(el.value || '').trim()) return; // rỗng thì thôi, không khóa
    const row = getRow(el);
    commitRow(row);
    e.preventDefault();
    el.blur();
  };

  // Blur (click ra ngoài) -> commit nếu có nội dung
  const onBlur = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !isTaskInput(el)) return;
    if (!(el.value || '').trim()) return; // rỗng thì không khóa
    const row = getRow(el);
    commitRow(row);
  };

  // Quét đầu vào: các hàng đã có text khi render thì xem là đã commit sẵn
  const scanExisting = () => {
    document
      .querySelectorAll('.calendar-task-input, .someday-task-input')
      .forEach((el) => {
        const row = getRow(el);
        if (!row) return;
        if ((el.value || '').trim()) row.classList.add('is-committed');
        else row.classList.remove('is-committed');
      });
  };
  // quét khi mount
  setTimeout(scanExisting, 0);

  // Cho phép trigger quét lại nếu bạn cần (VD sau khi modal cập nhật text)
  const rescan = () => setTimeout(scanExisting, 0);
  window.addEventListener('calendar:rescanCommit', rescan);
  window.addEventListener('someday:rescanCommit', rescan);

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('blur', onBlur, true);

  return () => {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('blur', onBlur, true);
    window.removeEventListener('calendar:rescanCommit', rescan);
    window.removeEventListener('someday:rescanCommit', rescan);
  };
}, []);

  // ➜ Nếu đã có cal:<id> mà trống, copy từ "user" (tránh trắng khi vừa chọn lịch)
  useEffect(() => {
    if (!authed || !activeCalendarId) return;
    try {
      const userKey = 'someday_tasks_v2:user';
      const calKey  = `someday_tasks_v2:cal:${activeCalendarId}`;
      if (!localStorage.getItem(userKey)) return;
      if (!localStorage.getItem(calKey)) {
        localStorage.setItem(calKey, localStorage.getItem(userKey));
      }
    } catch (e) {
      console.warn('Copy Someday user → cal failed', e);
    }
  }, [authed, activeCalendarId]);

  return (
    <div className="container">
      <Header
        viewDate={days?.[0] || new Date()}
        user={user}
        onUserClick={() => setShowAuth(true)}
        onLogout={handleLogout}
        onPrevWeek={prevWeek}
        onNextWeek={nextWeek}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCalendarSettings={() => setShowCalSettings(true)}
        onOpenAccount={() => setShowAccount(true)}
        calendars={calendars}
        activeCalendar={activeCalendar}
        onSwitchCalendar={handleSwitchCalendar}
        onCreateCalendar={handleCreateCalendar}
      />

      <CalendarGrid
        days={days}
        onOpenDetail={openTaskDetail}
        registerApi={(api) => { calendarApiRef.current = api; }}
      />

      <SomedaySection
        onOpenTask={openTaskDetail}
        registerApi={(api) => { somedayApiRef.current = api; }}
        scope={somedayScope}
      />

      {isSearchOpen && (
        <SearchModal
          tasks={tasks}
          onClose={() => setIsSearchOpen(false)}
          onOpenTask={openTaskDetail}
        />
      )}

      <TaskModal
        isOpen={!!activeTaskInfo}
        task={activeTaskInfo?.data}
        isSomeday={activeTaskInfo?.payload?.type === 'someday'}
        onClose={closeTaskDetail}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onMoveToTomorrow={handleMoveToTomorrow}
        onMoveToNextWeek={handleMoveToNextWeek}
        onMoveToSomeday={handleMoveToSomeday}
        onDuplicate={handleDuplicate}
        onAddAttachment={handleAddAttachment}
      />

      <AuthModal
        open={showAuth && !user}
        defaultMode="login"
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />

      <CalendarSettingsModal
        open={showCalSettings}
        onClose={() => setShowCalSettings(false)}
      />

      <AccountModal
        open={showAccount}
        onClose={() => setShowAccount(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <UiProvider>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </UiProvider>
  );
}
