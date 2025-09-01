// fe/src/data/adapter.js
import { apiFetch } from '../api/_fetch';
import { storage } from '../api/storage';

// ===== In-memory store cho chế độ guest (local) =====
const mem = {
  byDate: Object.create(null),
  board: { columns: [], tasksByCol: Object.create(null) },
};

function ensureDay(key) {
  if (!mem.byDate[key]) mem.byDate[key] = [];
  return mem.byDate[key];
}

function ensureBoard() {
  if (!Array.isArray(mem.board.columns)) mem.board.columns = [];
  if (!mem.board.tasksByCol || typeof mem.board.tasksByCol !== 'object') {
    mem.board.tasksByCol = Object.create(null);
  }
  return mem.board;
}

function uid() {
  return 'local_' + Math.random().toString(36).slice(2);
}

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

function stripBlockedFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  delete out.share_info;
  delete out.repeat_info;
  delete out.reminder_info;
  delete out.subtasks;
  return out;
}

function hasBlockedFields(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return (
    'share_info' in obj ||
    'repeat_info' in obj ||
    'reminder_info' in obj ||
    'subtasks' in obj
  );
}

// Lấy active calendar id từ storage/localStorage
const cal = () =>
  String(
    storage.getActiveCalendarId?.() ||
      localStorage.getItem('active_calendar_id') ||
      ''
  );

// ======================= LOCAL ADAPTER (Guest, RAM only) =======================
export const localAdapter = {
  async listRange() {
    const out = [];
    for (const k of Object.keys(mem.byDate)) {
      for (const t of mem.byDate[k]) out.push({ ...t, due_date: k });
    }
    return out;
  },

  async createTask(payload) {
    const k = payload?.due_date;
    const day = ensureDay(k);
    const row = { ...stripBlockedFields(payload || {}), id: uid() };
    day.push(row);
    return clone(row);
  },

  async updateTask(id, patch) {
    if (hasBlockedFields(patch)) {
      alert('Tính năng này chỉ khả dụng sau khi đăng nhập.');
      return null;
    }
    for (const k of Object.keys(mem.byDate)) {
      const day = mem.byDate[k];
      const i = day.findIndex((t) => t.id === id);
      if (i >= 0) {
        if (patch && 'due_date' in patch && patch.due_date && patch.due_date !== k) {
          const row = { ...day[i], ...stripBlockedFields(patch) };
          day.splice(i, 1);
          ensureDay(patch.due_date).push(row);
          return clone(row);
        }
        day[i] = { ...day[i], ...stripBlockedFields(patch) };
        return clone(day[i]);
      }
    }
    return null;
  },

  async deleteTask(id) {
    for (const k of Object.keys(mem.byDate)) {
      const day = mem.byDate[k];
      const i = day.findIndex((t) => t.id === id);
      if (i >= 0) {
        day.splice(i, 1);
        return null;
      }
    }
    return null;
  },

  // ===== Someday (guest: giới hạn, chỉ lưu RAM) =====
  async getSomeday() {
    ensureBoard();
    const cols = mem.board.columns.sort(
      (a, b) =>
        a.display_order - b.display_order ||
        a.id.localeCompare?.(b.id) ||
        0
    );
    const out = cols.map((c) => ({
      id: c.id,
      title: c.title || '',
      tasks: (mem.board.tasksByCol[c.id] || []).slice(),
    }));
    return out;
  },

  async createSomedayColumn(title = '') {
    ensureBoard();
    const nextOrder = mem.board.columns.length
      ? Math.max(...mem.board.columns.map((c) => c.display_order || 0)) + 1
      : 0;
    const col = { id: uid(), title: title || '', display_order: nextOrder };
    mem.board.columns.push(col);
    mem.board.tasksByCol[col.id] = [];
    return clone(col);
  },

  async updateSomedayColumn(id, patch) {
    ensureBoard();
    const i = mem.board.columns.findIndex((c) => c.id === id);
    if (i < 0) return null;
    mem.board.columns[i] = { ...mem.board.columns[i], ...(patch || {}) };
    return clone(mem.board.columns[i]);
  },

  async deleteSomedayColumn(id) {
    ensureBoard();
    const i = mem.board.columns.findIndex((c) => c.id === id);
    if (i >= 0) mem.board.columns.splice(i, 1);
    delete mem.board.tasksByCol[id];
    return null;
  },

  async createSomedayTask(row, columnId, afterIndex) {
    alert('Someday đầy đủ chỉ khả dụng sau khi đăng nhập.');
    ensureBoard();
    const list =
      mem.board.tasksByCol[columnId] ||
      (mem.board.tasksByCol[columnId] = []);
    const item = {
      ...stripBlockedFields(row || {}),
      id: uid(),
      someday_column_id: columnId,
    };
    if (Number.isInteger(afterIndex) && afterIndex >= 0 && afterIndex < list.length) {
      list.splice(afterIndex + 1, 0, item);
    } else {
      list.push(item);
    }
    return clone(item);
  },

  async updateSomedayTask(id, patch) {
    if (hasBlockedFields(patch)) {
      alert('Tính năng này chỉ khả dụng sau khi đăng nhập.');
      return null;
    }
    ensureBoard();
    for (const colId of Object.keys(mem.board.tasksByCol)) {
      const list = mem.board.tasksByCol[colId];
      const i = list.findIndex((t) => t.id === id);
      if (i >= 0) {
        if (patch && 'due_date' in patch && patch.due_date) {
          const row = { ...list[i], ...stripBlockedFields(patch) };
          list.splice(i, 1);
          ensureDay(patch.due_date).push(row);
          return clone(row);
        }
        list[i] = { ...list[i], ...stripBlockedFields(patch) };
        return clone(list[i]);
      }
    }
    return null;
  },

  async deleteSomedayTask(id) {
    ensureBoard();
    for (const colId of Object.keys(mem.board.tasksByCol)) {
      const list = mem.board.tasksByCol[colId];
      const i = list.findIndex((t) => t.id === id);
      if (i >= 0) {
        list.splice(i, 1);
        return null;
      }
    }
    return null;
  },
};

// ======================= SERVER ADAPTER (Login, DB) =======================
export const serverAdapter = {
  // ===== Calendar tasks (day view) =====
  listRange: (fromKey, toKey) =>
    apiFetch(
      `/api/tasks?calendarId=${encodeURIComponent(cal())}&from=${fromKey}&to=${toKey}`
    ),

  createTask: (payload) =>
    apiFetch(`/api/tasks`, {
      method: 'POST',
      body: { ...payload, calendar_id: Number(cal()) },
    }),

  updateTask: (id, patch) =>
    apiFetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: { ...patch, calendar_id: Number(cal()) },
    }),

  deleteTask: (id) =>
    apiFetch(
      `/api/tasks/${id}?calendarId=${encodeURIComponent(cal())}`,
      { method: 'DELETE' }
    ),

  // ===== Someday board =====
  getSomeday: () =>
    apiFetch(`/api/someday?calendarId=${encodeURIComponent(cal())}`),

  createSomedayColumn: (title /*, {calendarId}*/ ) =>
    apiFetch(`/api/someday/columns`, {
      method: 'POST',
      body: { title, calendar_id: Number(cal()) },
    }),

  updateSomedayColumn: (id, patch) =>
    apiFetch(`/api/someday/columns/${id}`, {
      method: 'PATCH',
      body: { ...patch, calendar_id: Number(cal()) },
    }),

  deleteSomedayColumn: (id) =>
    apiFetch(
      `/api/someday/columns/${id}?calendarId=${encodeURIComponent(cal())}`,
      { method: 'DELETE' }
    ),

  createSomedayTask: (row, columnId, afterIndex /*, {calendarId}*/ ) =>
    apiFetch(`/api/someday/tasks`, {
      method: 'POST',
      body: {
        ...row,
        someday_column_id: columnId,
        after_index: afterIndex,
        calendar_id: Number(cal()),
      },
    }),

  updateSomedayTask: (id, patch) =>
    apiFetch(`/api/someday/tasks/${id}`, {
      method: 'PATCH',
      body: { ...patch, calendar_id: Number(cal()) },
    }),

  deleteSomedayTask: (id) =>
    apiFetch(
      `/api/someday/tasks/${id}?calendarId=${encodeURIComponent(cal())}`,
      { method: 'DELETE' }
    ),
};

// ======================= PICK ADAPTER =======================
export function pickAdapter() {
  const token = (() => {
    try {
      return storage.getToken?.() || localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  })();
  const calId = (() => {
    try {
      return (
        storage.getActiveCalendarId?.() ||
        localStorage.getItem('active_calendar_id')
      );
    } catch {
      return null;
    }
  })();
  const isGuest = !token || !calId;
  return isGuest ? localAdapter : serverAdapter;
}
