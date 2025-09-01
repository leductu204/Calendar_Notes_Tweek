// src/api/auth.js
import { apiFetch } from './_fetch';
import * as storage from './storage';

function pickActiveCalendarId(calendars) {
  if (!Array.isArray(calendars) || calendars.length === 0) return null;
  const def = calendars.find(c => c.is_default);
  return String((def || calendars[0]).id);
}

export async function loginWithEmailPassword(email, password) {
  const resp = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  const token = resp?.token;
  const user  = resp?.user || null;
  if (!token) throw new Error('Đăng nhập thất bại');

  storage.setToken(token);
  storage.setUser(user);

  const calendars = await apiFetch('/api/calendars');
  const chosen = pickActiveCalendarId(calendars);
  if (chosen) storage.setActiveCalendarId(chosen);

  return resp;
}

export async function registerWithEmailPassword(name, email, password) {
  const resp = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });
  const token = resp?.token;
  const user  = resp?.user || null;
  if (!token) throw new Error('Đăng ký thất bại');

  storage.setToken(token);
  storage.setUser(user);

  const calendars = await apiFetch('/api/calendars');
  const chosen = pickActiveCalendarId(calendars);
  if (chosen) storage.setActiveCalendarId(chosen);

  return resp;
}

// Cho App.jsx sử dụng
export const auth = {
  setToken: storage.setToken,
  logout() {
    storage.setToken(null);
    storage.setUser(null);
    storage.setActiveCalendarId(null);
  }
};
