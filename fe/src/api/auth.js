// src/api/auth.js
import { apiFetch } from './_fetch';

export const auth = {
  async register({ name, email, password }) {
    return apiFetch('/api/auth/register', { method: 'POST', body: { name, email, password } });
  },
  async login({ email, password }) {
    return apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  logout() {
    try {
      localStorage.removeItem('token');
      // NEW: xoá id lịch hiện tại để quay về scope 'guest'
      localStorage.removeItem('app.activeCalendarId');
      // bắn event cho toàn app
      window.dispatchEvent(new Event('authChange'));
      window.dispatchEvent(new Event('activeCalendarChanged'));
    } catch {}
  },
  setToken(token) {
    try {
      localStorage.setItem('token', token);
      window.dispatchEvent(new Event('authChange'));
    } catch {}
  },
};
