// src/api/calendars.js
import { apiFetch } from './_fetch';

export const calendars = {
  list() {
    return apiFetch('/api/calendars');
  },
  create({ name, type = 'personal' }) {
    return apiFetch('/api/calendars', { method: 'POST', body: { name, type } });
  },
  getActiveCalendarId() {
    try { return localStorage.getItem('activeCalendarId'); } catch { return null; }
  },
  setActiveCalendarId(id) {
    try {
      localStorage.setItem('activeCalendarId', id);
      window.dispatchEvent(new Event('activeCalendarChanged'));
    } catch {}
  },
};
