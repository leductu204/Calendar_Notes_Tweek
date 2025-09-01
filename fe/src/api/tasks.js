// fe/src/api/tasks.js
const API_BASE = (import.meta.env?.VITE_API_BASE) || 'http://localhost:4000';

function authHeaders() {
  const t = localStorage.getItem('auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function listByRange(calendarId, from, to) {
  const url = new URL(`${API_BASE}/api/tasks`);
  url.searchParams.set('calendarId', String(calendarId));
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('listByRange failed');
  return res.json();
}

export async function createDay(calendarId, payload) {
  const body = { ...payload, calendar_id: Number(calendarId) };
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('createDay failed');
  return res.json();
}

export async function updateTask(calendarId, taskId, patch) {
  const body = { ...patch, calendar_id: Number(calendarId) };
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('updateTask failed');
  return res.json();
}

export async function deleteTask(calendarId, taskId) {
  const url = new URL(`${API_BASE}/api/tasks/${taskId}`);
  url.searchParams.set('calendarId', String(calendarId));
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) throw new Error('deleteTask failed');
  return true;
}
