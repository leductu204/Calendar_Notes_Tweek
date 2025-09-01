// src/api/calendars.js
import { apiFetch } from './_fetch';
import * as storage from './storage';

export const calendars = {
  list() {
    return apiFetch('/api/calendars');
  },
  create({ name, type = 'personal' }) {
    return apiFetch('/api/calendars', { method: 'POST', body: { name, type } });
  },
  getActiveCalendarId() {
    return storage.getActiveCalendarId();
  },
  setActiveCalendarId(id) {
    storage.setActiveCalendarId(id);
  },
};
