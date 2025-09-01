// fe/src/app/App.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../components/layout/Header.jsx';
import CalendarGrid from '../components/calendar/CalendarGrid.jsx';
import SomedaySection from '../components/someday/SomedaySection.jsx';
import SearchModal from '../components/modals/SearchModal.jsx';
import TaskModal from '../components/modals/TaskModal.jsx';
import AuthModal from '../components/modals/AuthModal.jsx';
import { UiProvider } from '../context/UiContext.jsx';
import { DataProvider, useData } from '../context/DataContext.jsx';
import { SomedayProvider } from '../context/SomedayContext.jsx';
import { useWeek } from '../hooks/useWeek.js';
import CalendarSettingsModal from '../components/modals/CalendarSettingsModal.jsx';
import AccountModal from '../components/modals/AccountModal.jsx';
import * as API from '../api';

const API_BASE = (import.meta.env?.VITE_API_BASE) || 'http://localhost:4000';

/* Helpers */
const addDays = (date, d = 0) => {
  const x = new Date(date);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() + d);
  return x;
};
const keyOf = (d) => {
  const x = new Date(d);
  x.setHours(12,0,0,0);
  return x.toISOString().slice(0,10);
};

function AppShell() {
  const { days, prevWeek, nextWeek } = useWeek();
  const { getTask, getTasksForDate, updateMeta, removeTask } = useData();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskInfo, setActiveTaskInfo] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [showCalSettings, setShowCalSettings] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const [calendars, setCalendars] = useState([]);
  const [activeCalendarId, setActiveCalendarId] = useState(() => API.calendars.getActiveCalendarId());

  const [authed, setAuthed] = useState(() => !!API.storage.getToken());

  useEffect(() => {
    const onAuth = () => setAuthed(!!API.storage.getToken());
    window.addEventListener('authChange', onAuth);
    return () => window.removeEventListener('authChange', onAuth);
  }, []);

  // Bootstrap
  useEffect(() => {
    const token = API.storage.getToken();
    if (!token) {
      setUser(null);
      setAuthed(false);
      return;
    }
    (async () => {
      try {
        const me = await API.apiFetch('/api/auth/me');
        const u = me?.user || null;
        setUser(u);
        API.storage.setUser(u);

        const list = await API.calendars.list().catch(() => []);
        setCalendars(list || []);

        const stored = API.storage.getActiveCalendarId();
        const nextId = stored || (list && list[0]?.id) || null;
        if (nextId) {
          setActiveCalendarId(String(nextId));
          API.storage.setActiveCalendarId(String(nextId));
        }
      } catch {
        API.storage.setToken(null);
        API.storage.setUser(null);
        setUser(null);
        setAuthed(false);
      }
    })();
  }, []);

  // OAuth callback (?token=&user=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userJson = params.get('user');

    if (token) {
      API.storage.setToken(token);
      try {
        const u = JSON.parse(userJson || 'null');
        setUser(u || null);
        API.storage.setUser(u || null);
      } catch {
        setUser(null);
        API.storage.setUser(null);
      }

      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());

      API.calendars.list().then(list => {
        setCalendars(list || []);
        const nextId =
          API.storage.getActiveCalendarId() || list?.[0]?.id || null;
        if (nextId) {
          setActiveCalendarId(String(nextId));
          API.storage.setActiveCalendarId(String(nextId));
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!activeCalendarId) return;
    API.storage.setActiveCalendarId(String(activeCalendarId));
    window.dispatchEvent(new Event('activeCalendarChanged'));
  }, [activeCalendarId]);

  const activeCalendar =
    calendars.find(c => String(c.id) === String(activeCalendarId)) || null;

  const handleCreateCalendar = async ({ type, name }) => {
    const created = await API.calendars.create({ type, name });
    const list = await API.calendars.list();
    setCalendars(list || []);
    const nextId = created?.id || list?.[0]?.id || null;
    if (nextId) {
      setActiveCalendarId(String(nextId));
      API.storage.setActiveCalendarId(String(nextId));
    }
  };

  const handleSwitchCalendar = (id) => setActiveCalendarId(String(id));

  const handleAuthSuccess = ({ token, user }) => {
    if (token) API.storage.setToken(token);
    API.storage.setUser(user || null);
    setUser(user || null);

    API.calendars.list().then(list => {
      setCalendars(list || []);
      const nextId =
        API.storage.getActiveCalendarId() || list?.[0]?.id || null;
      if (nextId) setActiveCalendarId(String(nextId));
    }).catch(() => {});
    setShowAuth(false);
  };

  const handleLogout = () => {
    API.storage.setToken(null);
    API.storage.setUser(null);
    setUser(null);
    setCalendars([]);
    setActiveCalendarId(null);
  };

  const handleUpdateUser = () => {};

  // refs cho CalendarGrid / SomedaySection (nếu cần sau này)
  const somedayApiRef = useRef(null);
  const calendarApiRef = useRef(null);

  /* === MỞ MODAL: luôn gắn kèm data === */
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
      const taskData = getTask?.(payload.dateKey, payload.lineIdx) || {};
      setActiveTaskInfo({
        payload,
        data: { ...taskData, date: payload.date || new Date(payload.dateKey) }
      });
    }
  }, [getTask]);

  const closeTaskDetail = useCallback(() => setActiveTaskInfo(null), []);

  /* ---- Move/Duplicate helpers (local) ---- */
  const moveTaskToDateLocal = useCallback((fromDateKey, lineIdx, targetDate) => {
    const targetKey = keyOf(targetDate);
    const data = getTask?.(fromDateKey, lineIdx) || {};
    removeTask(fromDateKey, lineIdx);
    const targetIndex = (getTasksForDate?.(targetKey)?.length || 0);
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
    const data = getTask?.(dateKey, lineIdx) || {};
    const idx = (getTasksForDate?.(dateKey)?.length || 0);
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

  /* ---- Update/Delete/Move actions ---- */
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
  const data = getTask?.(dateKey, lineIdx) || {};

  const row = {
    text: data.text || '',
    notes: data.notes || '',
    color: data.color || '',
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    repeat_info: data.repeat_info || { type: 'never' },
    reminder_info: data.reminder_info || null,
    share_info: data.share_info || { enabled: false },
    links: Array.isArray(data.links) ? data.links : [],
    done: !!(data.done ?? data.is_done),
    is_done: !!(data.done ?? data.is_done),
  };

  // ⬇️ gọi API tạo task bên Someday
  somedayApiRef.current?.createSomedayTask?.(null, row, undefined);

  removeTask(dateKey, lineIdx);
  closeTaskDetail();
 }, [activeTaskInfo, getTask, removeTask, closeTaskDetail]);


  const handleDuplicate = useCallback(() => {
    if (!activeTaskInfo) return;
    const p = activeTaskInfo.payload;

    if (p.type === 'someday') {
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
      // nếu SomedayProvider có API tạo hàng mới:
       somedayApiRef.current?.createSomedayTask?.(p.columnId, row, p.rowIndex);
    } else {
      duplicateTaskLocal(p.dateKey, p.lineIdx);
    }
  }, [activeTaskInfo, duplicateTaskLocal]);

  const handleAddAttachment = useCallback(() => {}, []);

  // Khoá scroll nền khi có modal
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

  // Scope Someday (nếu dùng)
  const somedayScope = authed
    ? (activeCalendarId ? `cal:${activeCalendarId}` : 'user')
    : 'guest';

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
        activeCalendar={calendars.find(c => String(c.id) === String(activeCalendarId)) || null}
        onSwitchCalendar={setActiveCalendarId}
        onCreateCalendar={handleCreateCalendar}
      />

      {/* ✅ dùng openTaskDetail để truyền cả payload + data */}
      <CalendarGrid days={days} onOpenDetail={openTaskDetail} />
      <SomedaySection
           onOpenTask={openTaskDetail}
           registerApi={(api) => { somedayApiRef.current = api; }}
           authed={authed}
          activeCalendarId={activeCalendarId}
       />

      {isSearchOpen && (
        <SearchModal
          tasks={{}}
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

      <CalendarSettingsModal open={showCalSettings} onClose={() => setShowCalSettings(false)} />
      <AccountModal open={showAccount} onClose={() => setShowAccount(false)} user={user} />
    </div>
  );
}

export default function App() {
  return (
    <UiProvider>
      <DataProvider>
        <SomedayProvider>
          <AppShell />
        </SomedayProvider>
      </DataProvider>
    </UiProvider>
  );
}
