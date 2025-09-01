// FE: fe/src/context/SomedayContext.jsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { pickAdapter } from '../data/adapter';

const SomedayCtx = createContext(null);

export function SomedayProvider({ children }) {
  const adapter = pickAdapter();
  const [columns, setColumns] = useState([]);

  const loadBoard = useCallback(async () => {
    const data = await adapter.getSomeday();
    const safe = Array.isArray(data) ? data.map(c => ({
      id: String(c.id),
      title: c.title || '',
      tasks: Array.isArray(c.tasks) ? c.tasks.map(t => ({ ...t })) : [],
    })) : [];
    setColumns(safe);
  }, [adapter]);

  const createColumn = useCallback(async (title = '') => {
    await adapter.createSomedayColumn(title);
    await loadBoard();
  }, [adapter, loadBoard]);

  const renameColumn = useCallback(async (id, title) => {
    await adapter.updateSomedayColumn(String(id), { title: String(title || '') });
    // có thể không reload để nhanh hơn, Section đã optimistic update tiêu đề
  }, [adapter]);

  const deleteColumn = useCallback(async (id) => {
    await adapter.deleteSomedayColumn(String(id));
    await loadBoard();
  }, [adapter, loadBoard]);

  // NOTE: SomedaySection.handleCommit() đã tự loadBoard → tránh gọi 2 lần
  const createTask = useCallback(async (columnId, row, afterIndex) => {
    await adapter.createSomedayTask(row || {}, String(columnId), Number.isFinite(afterIndex) ? afterIndex : undefined);
  }, [adapter]);

  const updateTask = useCallback(async (id, patch) => {
    await adapter.updateSomedayTask(String(id), patch || {});
  }, [adapter]);

  const deleteTask = useCallback(async (id) => {
    await adapter.deleteSomedayTask(String(id));
    await loadBoard();
  }, [adapter, loadBoard]);

  const moveTaskToDate = useCallback(async (id, targetDate) => {
    await adapter.updateSomedayTask(String(id), { due_date: targetDate });
    await loadBoard();
  }, [adapter, loadBoard]);

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
