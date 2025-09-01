import React, {
  createContext, useContext, useMemo, useState,
  useCallback, useEffect
} from 'react';
import { pickAdapter } from '../data/adapter';
import * as API from '../api';

const SomedayCtx = createContext(null);

export function SomedayProvider({ children }) {
  const adapter = pickAdapter();
  const [columns, setColumns] = useState([]);

  const getToken = () =>
    API.storage.getToken?.() || localStorage.getItem('auth_token') || null;

  const getActiveCalendarId = () =>
    API.storage.getActiveCalendarId?.() || localStorage.getItem('active_calendar_id') || null;

  // ---- LOAD BOARD ----
  const loadBoard = useCallback(async () => {
    const token = getToken();
    const calendarId = getActiveCalendarId();
    // guest vẫn hiển thị (local adapter sẽ seed 3 cột); login thì cần calendarId
    if (!token && !calendarId) {
      // guest + chưa có calId: vẫn cứ gọi (localAdapter sẽ seed)
    }

    try {
      const data = adapter.getSomeday?.length >= 1
        ? await adapter.getSomeday(calendarId)
        : await adapter.getSomeday({ calendarId });

      const safe = Array.isArray(data)
        ? data.map(c => ({
            id: String(c.id),
            title: c.title || '',
            tasks: Array.isArray(c.tasks) ? c.tasks.map(t => ({ ...t })) : [],
          }))
        : [];

      setColumns(safe);
    } catch (e) {
      console.warn('Someday loadBoard failed:', e?.message || e);
      setColumns([]);
    }
  }, [adapter]);

  // ---- CRUD (truyền calendarId nếu có) ----
  const createColumn = useCallback(async (title = '') => {
    const calendarId = getActiveCalendarId();
    await adapter.createSomedayColumn(title, { calendarId });
    await loadBoard();
  }, [adapter, loadBoard]);

  const renameColumn = useCallback(async (id, title) => {
    const calendarId = getActiveCalendarId();
    await adapter.updateSomedayColumn(String(id), { title: String(title || ''), calendarId });
  }, [adapter]);

  const deleteColumn = useCallback(async (id) => {
    const calendarId = getActiveCalendarId();
    await adapter.deleteSomedayColumn(String(id), { calendarId });
    await loadBoard();
  }, [adapter, loadBoard]);

  const createTask = useCallback(async (columnId, row, afterIndex) => {
    const calendarId = getActiveCalendarId();
    await adapter.createSomedayTask(
      row || {},
      String(columnId ?? ''),
      Number.isFinite(afterIndex) ? afterIndex : undefined,
      { calendarId }
    );
    await loadBoard();
  }, [adapter, loadBoard]);

  const updateTask = useCallback(async (id, patch) => {
    const calendarId = getActiveCalendarId();
    await adapter.updateSomedayTask(String(id), { ...patch, calendarId });
  }, [adapter]);

  const deleteTask = useCallback(async (id) => {
    const calendarId = getActiveCalendarId();
    await adapter.deleteSomedayTask(String(id), { calendarId });
    await loadBoard();
  }, [adapter, loadBoard]);

  const moveTaskToDate = useCallback(async (id, targetDate) => {
    const calendarId = getActiveCalendarId();
    if (adapter.moveSomedayTaskToDate) {
      await adapter.moveSomedayTaskToDate(String(id), targetDate, { calendarId });
    } else {
      await adapter.updateSomedayTask(String(id), { due_date: targetDate, calendarId });
    }
    await loadBoard();
  }, [adapter, loadBoard]);

  // Tự load khi mount + khi auth/calendar đổi
  useEffect(() => {
    const onAuthOrCal = () => loadBoard();
    window.addEventListener('authChange', onAuthOrCal);
    window.addEventListener('activeCalendarChanged', onAuthOrCal);
    onAuthOrCal();
    return () => {
      window.removeEventListener('authChange', onAuthOrCal);
      window.removeEventListener('activeCalendarChanged', onAuthOrCal);
    };
  }, [loadBoard]);

  const value = useMemo(() => ({
    columns,
    loadBoard,
    createColumn,
    renameColumn,
    deleteColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTaskToDate,
  }), [columns, loadBoard, createColumn, renameColumn, deleteColumn, createTask, updateTask, deleteTask, moveTaskToDate]);

  return <SomedayCtx.Provider value={value}>{children}</SomedayCtx.Provider>;
}

export const useSomeday = () => useContext(SomedayCtx);
