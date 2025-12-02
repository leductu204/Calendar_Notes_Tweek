// FE: fe/src/api/_fetch.js
import * as storage from './storage';

let API_BASE_URL = 'http://localhost:4000';
try {
  if (import.meta && import.meta.env && (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL)) {
    API_BASE_URL = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL;
  } else if (typeof window !== 'undefined' && window.location && (window.location.port === '5173' || window.location.port === '5174')) {
    API_BASE_URL = 'http://localhost:4000';
  } else if (typeof window !== 'undefined' && window.location) {
    API_BASE_URL = window.location.origin;
  }
} catch {}

export { API_BASE_URL };

// Dùng storage để thống nhất key và sự kiện
function getToken() {
  return storage.getToken();
}

function getActiveCalendarId() {
  return storage.getActiveCalendarId();
}

// Add a simple request cache to prevent duplicate requests
const requestCache = new Map();
const CACHE_DURATION = 1000; // 1 second

export async function apiFetch(endpoint, { method = 'GET', headers = {}, body } = {}) {
  const token = getToken();
  const calId = getActiveCalendarId();

  const isAbsolute = typeof endpoint === 'string' && /^https?:\/\//i.test(endpoint);
  const base = isAbsolute ? endpoint : `${API_BASE_URL}${endpoint}`;
  const url = new URL(base);

  // auto append calendarId nếu có (trừ khi đã có sẵn)
  if (calId && !url.searchParams.has('calendarId')) {
    url.searchParams.set('calendarId', calId);
  }

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const res = await fetch(url.toString(), {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    if (res.status === 204 || res.status === 205) return null;

    // cố gắng parse JSON nếu có
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // lỗi: cố gắng đọc thông điệp từ body
  let msg = 'Request failed';
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      msg = j?.message || JSON.stringify(j);
    } else {
      const t = await res.text();
      msg = t || msg;
    }
  } catch {}

  const err = new Error(msg);
  err.status = res.status;
  throw err;
}

// Giữ nguyên API cũ nhưng ủy quyền sang storage để đồng bộ khắp nơi
export const authStore = {
  loginSuccess(token) {
    storage.setToken(token);
  },
  logout() {
    storage.setToken(null);
    storage.setUser(null);
    storage.setActiveCalendarId(null);
    // storage đã tự bắn event; ở đây không cần bắn thêm
  },
  setToken(token) {
    storage.setToken(token);
  },
};
