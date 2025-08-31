// src/api/_fetch.js
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL
  || (typeof window !== 'undefined' && window.location?.port === '5173'
        ? 'http://localhost:4000'     // dev FE -> đoán BE 4000
        : 'http://localhost:3001');   // fallback khác nếu build chỗ khác

function getToken() {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export async function apiFetch(endpoint, { method='GET', headers={}, body } = {}) {
  const token = getToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const init = { method, headers: finalHeaders };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, init);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(text || 'Có lỗi xảy ra');
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}
