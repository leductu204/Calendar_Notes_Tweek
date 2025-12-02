// fe/src/api/notes.js
import * as storage from './storage';
import { API_BASE_URL as API_BASE } from './_fetch';

function authHeaders() {
  const t = storage.getToken();
  console.log('[Notes API] Getting auth headers - token exists:', !!t);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function listNotes(archived = false, search = '') {
  const url = new URL(`${API_BASE}/api/notes`);
  if (archived) url.searchParams.set('archived', 'true');
  if (search) url.searchParams.set('search', search);

  console.log('[Notes API] Calling listNotes:', url.toString());
  const res = await fetch(url.toString(), {
    headers: { ...authHeaders() },
    credentials: 'include'
  });
  console.log('[Notes API] listNotes response status:', res.status);
  if (!res.ok) {
    console.error('[Notes API] listNotes failed with status:', res.status);

    // If unauthorized, clear token and trigger auth change event
    if (res.status === 401) {
      console.log('[Notes API] Token expired or invalid, clearing auth');
      storage.setToken(null);
      storage.setUser(null);
    }

    throw new Error(`listNotes failed with status ${res.status}`);
  }
  const data = await res.json();
  console.log('[Notes API] listNotes response data:', data);
  return data;
}

export async function createNote(noteData) {
  console.log('[Notes API] createNote calling...', noteData);
  const res = await fetch(`${API_BASE}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(noteData),
  });
  if (!res.ok) {
    console.error('[Notes API] createNote failed:', res.status);
    throw new Error('createNote failed');
  }
  const json = await res.json();
  console.log('[Notes API] createNote success:', json);
  return json;
}

export async function getNote(noteId) {
  const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
    headers: { ...authHeaders() },
    credentials: 'include'
  });
  if (!res.ok) throw new Error('getNote failed');
  return res.json();
}

export async function updateNote(noteId, updates) {
  console.log('[Notes API] updateNote calling:', noteId, updates);
  const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    console.error('[Notes API] updateNote failed:', res.status);
    throw new Error('updateNote failed');
  }
  const json = await res.json();
  console.log('[Notes API] updateNote success:', json);
  return json;
}

export async function updateNoteColor(noteId, color) {
  const res = await fetch(`${API_BASE}/api/notes/${noteId}/color`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include',
    body: JSON.stringify({ color }),
  });
  if (!res.ok) throw new Error('updateNoteColor failed');
  return res.json();
}

export async function deleteNote(noteId) {
  console.log('[Notes API] deleteNote calling:', noteId);
  const res = await fetch(`${API_BASE}/api/notes/${noteId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    credentials: 'include'
  });
  if (!res.ok && res.status !== 204) {
    console.error('[Notes API] deleteNote failed:', res.status);
    throw new Error('deleteNote failed');
  }
  console.log('[Notes API] deleteNote success');
  return true;
}

export async function bulkAction(noteIds, action, data = null) {
  const body = { noteIds, action };
  if (data) body.data = data;

  const res = await fetch(`${API_BASE}/api/notes/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('bulkAction failed');
  return res.json();
}
