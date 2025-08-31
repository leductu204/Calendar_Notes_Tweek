// src/api/tasks.js
import { apiFetch } from './_fetch';
import { getToken, keys, readJSON, writeJSON } from './storage';

// ===== Server API (đăng nhập) =====
export const serverApi = {
  listRange: (calendarId, from, to) =>
    apiFetch(`/api/tasks?calendarId=${encodeURIComponent(calendarId)}&from=${from}&to=${to}`),

  createTask: (taskData) =>
    apiFetch('/api/tasks', { method: 'POST', body: taskData }),

  updateTask: (taskId, patch) =>
    apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: patch }),

  deleteTask: (taskId) =>
    apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' }),
};

// ===== Local API (khách) =====
const getLocalCalId = () => 'guest_calendar';
const readAllLocal = () => readJSON(keys.tasks(getLocalCalId()), {});
const writeAllLocal = (payload) => writeJSON(keys.tasks(getLocalCalId()), payload || {});

export const localApi = {
  listAll: () => readAllLocal(),
  getDayTasks: (dateKey) => {
    const all = readAllLocal();
    return Array.isArray(all[dateKey]) ? all[dateKey] : [];
  },
  insertTask: (dateKey, lineIdx, init) => {
    const all = readAllLocal();
    const day = Array.isArray(all[dateKey]) ? [...all[dateKey]] : [];
    const curId = day[lineIdx]?.id || `local_${Date.now()}`;
    day[lineIdx] = { ...(day[lineIdx] || {}), ...(init || {}), id: curId };
    all[dateKey] = day;
    writeAllLocal(all);
  },
  updateTask: (dateKey, lineIdx, partial) => {
    const all = readAllLocal();
    const day = Array.isArray(all[dateKey]) ? [...all[dateKey]] : [];
    const cur = (typeof day[lineIdx] === 'object' && day[lineIdx] !== null)
      ? day[lineIdx]
      : { text: day[lineIdx] || '' };
    day[lineIdx] = { ...cur, ...partial, id: cur.id || `local_${Date.now()}` };
    all[dateKey] = day;
    writeAllLocal(all);
  },
  removeTask: (dateKey, lineIdx) => {
    const all = readAllLocal();
    const day = Array.isArray(all[dateKey]) ? [...all[dateKey]] : [];
    day.splice(lineIdx, 1);
    all[dateKey] = day;
    writeAllLocal(all);
  },
};
