// fe/src/app/App.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../components/layout/Header.jsx';
import CalendarGrid from '../components/calendar/CalendarGrid.jsx';
import SomedaySection from '../components/someday/SomedaySection.jsx';
import CalendarNotesGrid from '../components/calendar/CalendarNotesGrid.jsx';
import SearchModal from '../components/modals/SearchModal.jsx';
// import TaskModal from '../components/modals/TaskModal.jsx';
import NoteEditor from '../components/notes/NoteEditor.jsx';
import AuthModal from '../components/modals/AuthModal.jsx';
import { UiProvider } from '../context/UiContext.jsx';
import { DataProvider, useData } from '../context/DataContext.jsx';
import { SomedayProvider } from '../context/SomedayContext.jsx';
import { useWeek } from '../hooks/useWeek.js';
import CalendarSettingsModal from '../components/modals/CalendarSettingsModal.jsx';
import AccountModal from '../components/modals/AccountModal.jsx';
import * as API from '../api';
import '../styles/notes.css';

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
  x.setHours(12, 0, 0, 0);
  return x.toISOString().slice(0, 10);
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

  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("calendar.settings") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    const onSettings = (e) => setSettings(e.detail);
    window.addEventListener('calendar:settings', onSettings);
    return () => window.removeEventListener('calendar:settings', onSettings);
  }, []);

  // Auto-move overdue tasks if enabled
  useEffect(() => {
    if (authed && activeCalendarId && settings.moveUncompletedToday) {
      const today = keyOf(new Date());
      API.tasks.moveOverdueToToday(activeCalendarId, today)
        .then((res) => {
          if (res.updated > 0) {
            console.log(`[App] Moved ${res.updated} overdue tasks to today`);
            window.dispatchEvent(new Event('activeCalendarChanged')); // Refresh data
          }
        })
        .catch(err => console.error('[App] Auto-move failed:', err));
    }
  }, [authed, activeCalendarId, settings.moveUncompletedToday]);

  useEffect(() => {
    const onAuth = () => {
      const hasToken = !!API.storage.getToken();
      console.log('[App] Auth change event - token exists:', hasToken);
      setAuthed(hasToken);
      if (!hasToken) {
        setUser(null);
        setCalendars([]);
        setActiveCalendarId(null);
      }
    };
    window.addEventListener('authChange', onAuth);
    return () => window.removeEventListener('authChange', onAuth);
  }, []);

  // Bootstrap
  useEffect(() => {
    const token = API.storage.getToken();
    console.log('[App] Bootstrap - token found:', !!token);

    if (!token) {
      console.log('[App] No token, setting user to null');
      setUser(null);
      setAuthed(false);
      setAuthChecked(true);
      return;
    }

    console.log('[App] Token found, verifying with server...');
    (async () => {
      try {
        const me = await API.apiFetch('/api/auth/me');
        const u = me?.user || null;
        console.log('[App] Auth verification successful:', u);
        setUser(u);
        API.storage.setUser(u);

        const list = await API.calendars.list().catch(() => []);
        console.log('[App] Calendars loaded:', list?.length || 0);
        setCalendars(list || []);

        const stored = API.storage.getActiveCalendarId();
        let nextId = stored;
        
        // Validate stored ID against list
        const isValid = list?.some(c => String(c.id) === String(stored));
        if (!isValid) {
          nextId = (list && list[0]?.id) || null;
        }

        console.log('[App] Setting active calendar:', nextId);
        if (nextId) {
          setActiveCalendarId(String(nextId));
          API.storage.setActiveCalendarId(String(nextId));
        }

        // Explicitly set authed to true after successful verification
        setAuthed(true);
        setAuthChecked(true);
        console.log('[App] Authentication complete, user is authenticated');
      } catch (error) {
        console.error('[App] Auth verification failed:', error);
        API.storage.setToken(null);
        API.storage.setUser(null);
        setUser(null);
        setAuthed(false);
        setAuthChecked(true);
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
      }).catch(() => { });
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
    }).catch(() => { });
    setShowAuth(false);
  };

  const handleLogout = () => {
    API.storage.setToken(null);
    API.storage.setUser(null);
    setUser(null);
    setCalendars([]);
    setActiveCalendarId(null);
  };

  const handleUpdateUser = () => { };

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
        extra_notes: payload.extra_notes || '',
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
      extra_notes: data.extra_notes || '',
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
      extra_notes: data.extra_notes || '',
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
    if ('content' in patch && !('notes' in patch)) { patch.notes = patch.content; delete patch.content; }
    if ('repeat' in patch && !('repeat_info' in patch)) { patch.repeat_info = patch.repeat; delete patch.repeat; }
    if ('reminder' in patch && !('reminder_info' in patch)) { patch.reminder_info = patch.reminder; delete patch.reminder; }
    if ('share' in patch && !('share_info' in patch)) { patch.share_info = patch.share; delete patch.share; }

    console.log('[App] handleUpdateTask - updatedData:', updatedData);
    console.log('[App] handleUpdateTask - patch:', patch);
    console.log('[App] handleUpdateTask - isSomeday:', p.type === 'someday');

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
      extra_notes: data.extra_notes || '',
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
        extra_notes: data.extra_notes || '',
      };
      // nếu SomedayProvider có API tạo hàng mới:
      somedayApiRef.current?.createSomedayTask?.(p.columnId, row, p.rowIndex);
    } else {
      duplicateTaskLocal(p.dateKey, p.lineIdx);
    }
  }, [activeTaskInfo, duplicateTaskLocal]);

  const handleAddAttachment = useCallback(() => { }, []);

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

      {/* Main content - always show calendar and notes together when authenticated */}
      {authChecked && authed && (
        <>
          <CalendarNotesGrid days={days} hideCompleted={settings.hideCompleted} />
          <SomedaySection
            key={days?.[0] ? keyOf(days[0]) : 'someday-section'}
            weekKey={days?.[0] ? keyOf(days[0]) : ''}
            onOpenTask={openTaskDetail}
            registerApi={(api) => { somedayApiRef.current = api; }}
            authed={authed}
            activeCalendarId={activeCalendarId}
          />
        </>
      )}

      {authChecked && !authed && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Bạn cần đăng nhập để xem lịch và ghi chú.</p>
          <button onClick={() => setShowAuth(true)}>Đăng nhập</button>
        </div>
      )}

      {!authChecked && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Đang kiểm tra đăng nhập...</p>
        </div>
      )}

      {isSearchOpen && (
        <SearchModal
          tasks={{}}
          onClose={() => setIsSearchOpen(false)}
          onOpenTask={openTaskDetail}
        />
      )}

      {activeTaskInfo && (
        <NoteEditor
          note={{
            ...activeTaskInfo.data,
            title: activeTaskInfo.data.text || '',
            content: activeTaskInfo.data.notes || '',
            extra_notes: activeTaskInfo.data.extra_notes || '',
            id: activeTaskInfo.data.id || Date.now()
          }}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          onClose={closeTaskDetail}
          isSomeday={activeTaskInfo?.payload?.type === 'someday'}
        />
      )}

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
