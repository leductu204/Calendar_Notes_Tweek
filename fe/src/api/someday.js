// src/api/someday.js
import { apiFetch } from './_fetch';

export const someday = {
  // Lấy toàn bộ board (các cột + task Someday) cho 1 calendar
  board(calendarId) {
    return apiFetch(`/api/someday?calendarId=${calendarId}`);
  },

  // Cột
  createColumn(calendarId, { title = '' } = {}) {
    return apiFetch(`/api/someday/columns?calendarId=${calendarId}`, {
      method: 'POST',
      body: { title },
    });
  },
  updateColumn(calendarId, columnId, { title }) {
    return apiFetch(`/api/someday/columns/${columnId}?calendarId=${calendarId}`, {
      method: 'PATCH',
      body: { title },
    });
  },
  deleteColumn(calendarId, columnId) {
    return apiFetch(`/api/someday/columns/${columnId}?calendarId=${calendarId}`, {
      method: 'DELETE',
    });
  },

  // Task trong Someday
  createTask(calendarId, payload) {
    // payload: { column_id, text, notes, is_done, color, subtasks, attachments, repeat_info, reminder_info, links }
    return apiFetch(`/api/someday/tasks?calendarId=${calendarId}`, {
      method: 'POST',
      body: payload,
    });
  },
  updateTask(calendarId, taskId, patch) {
    return apiFetch(`/api/someday/tasks/${taskId}?calendarId=${calendarId}`, {
      method: 'PATCH',
      body: patch,
    });
  },
  moveToDate(calendarId, taskId, due_date) {
    // due_date: 'YYYY-MM-DD'
    return apiFetch(`/api/someday/tasks/${taskId}/move-to-date?calendarId=${calendarId}`, {
      method: 'POST',
      body: { due_date },
    });
  },
  deleteTask(calendarId, taskId) {
    return apiFetch(`/api/someday/tasks/${taskId}?calendarId=${calendarId}`, {
      method: 'DELETE',
    });
  },
};
