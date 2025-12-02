// fe/src/api/someday.js
import { API_BASE_URL as API_BASE } from './_fetch';

import * as storage from './storage';

function authHeaders() {
  const t = storage.getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ===== Columns =====
export async function board(calendarId, week = '') {
  const res = await fetch(`${API_BASE}/api/someday?calendarId=${encodeURIComponent(calendarId)}&week=${encodeURIComponent(week)}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to load Someday board');
  return res.json(); // [{ id, title, tasks: [...] }]
}

export async function createColumn(calendarId, payload) {
  const res = await fetch(`${API_BASE}/api/someday/columns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ calendar_id: calendarId, ...payload }),
  });
  if (!res.ok) throw new Error('Failed to create column');
  return res.json();
}

export async function updateColumn(calendarId, id, patch) {
  const res = await fetch(`${API_BASE}/api/someday/columns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ calendar_id: calendarId, ...patch }),
  });
  if (!res.ok) throw new Error('Failed to update column');
  return res.json();
}

export async function deleteColumn(calendarId, id) {
  const res = await fetch(`${API_BASE}/api/someday/columns/${id}?calendarId=${encodeURIComponent(calendarId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete column');
  return true;
}

// ===== Tasks =====
export async function createTask(calendarId, payload) {
  const res = await fetch(`${API_BASE}/api/someday/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ calendar_id: calendarId, ...payload }),
  });
  if (!res.ok) throw new Error('Failed to create someday task');
  return res.json();
}

export async function updateTask(calendarId, id, patch) {
  const res = await fetch(`${API_BASE}/api/someday/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ calendar_id: calendarId, ...patch }),
  });
  if (!res.ok) throw new Error('Failed to update someday task');
  return res.json();
}

export async function moveToDate(calendarId, id, due_date) {
  const res = await fetch(`${API_BASE}/api/someday/tasks/${id}/move-to-date`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ calendar_id: calendarId, due_date }),
  });
  if (!res.ok) throw new Error('Failed to move someday task to date');
  return res.json();
}


export async function deleteTask(calendarId, id) {
  const res = await fetch(`${API_BASE}/api/someday/tasks/${id}?calendarId=${encodeURIComponent(calendarId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete someday task');
  return true;
}
