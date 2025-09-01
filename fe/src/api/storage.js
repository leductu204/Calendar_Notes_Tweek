// fe/src/api/storage.js
export const KEYS = {
  token: 'auth_token',
  user: 'auth_user',
  activeCal: 'active_calendar_id',
};

// ===== Token =====
export function getToken() {
  try { return localStorage.getItem(KEYS.token) || null; } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(KEYS.token, token);
    else localStorage.removeItem(KEYS.token);
  } catch {}
  window.dispatchEvent(new Event('authChange'));
}

// ===== User =====
export function getUser() {
  try {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setUser(user) {
  try {
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(KEYS.user);
  } catch {}
  window.dispatchEvent(new Event('authChange'));
}

// ===== Active Calendar =====
export function getActiveCalendarId() {
  try { return localStorage.getItem(KEYS.activeCal) || null; } catch { return null; }
}
export function setActiveCalendarId(id) {
  try {
    if (id) localStorage.setItem(KEYS.activeCal, String(id));
    else localStorage.removeItem(KEYS.activeCal);
  } catch {}
  window.dispatchEvent(new Event('activeCalendarChanged'));
}

// ✅ Gom lại để có thể gọi API.storage.getToken()
export const storage = {
  KEYS,
  getToken,
  setToken,
  getUser,
  setUser,
  getActiveCalendarId,
  setActiveCalendarId,
};
