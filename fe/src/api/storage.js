// src/api/storage.js
const TOKEN_KEY = 'token';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function setToken(t) {
  try {
    if (t == null) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, t);
    window.dispatchEvent(new Event('authChange'));
  } catch {}
}

function clearToken() {
  setToken(null);
}

const keys = {
  tasks: (calendarId) => `tasks:${calendarId}`,
};

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const storage = {
  getToken,
  setToken,
  clearToken,
  keys,
  readJSON,
  writeJSON,
};

export { getToken, setToken, clearToken, keys, readJSON, writeJSON };
