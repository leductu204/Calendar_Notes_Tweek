// src/api/someday.js
import { apiFetch } from "./_fetch";

export const board = (calendarId) =>
  apiFetch(`/api/someday?calendarId=${encodeURIComponent(calendarId)}`, { method: "GET" });

export const createColumn = (calendarId, { title = "" }) =>
  apiFetch(`/api/someday/columns`, {
    method: "POST",
    body: { calendar_id: calendarId, title },
  });

export const updateColumn = (calendarId, id, { title }) =>
  apiFetch(`/api/someday/columns/${id}`, {
    method: "PATCH",
    body: { calendar_id: calendarId, title },
  });

export const deleteColumn = (calendarId, id) =>
  apiFetch(`/api/someday/columns/${id}`, {
    method: "DELETE",
    body: { calendar_id: calendarId },
  });

// Tasks
export const createTask = (calendarId, payload) =>
  apiFetch(`/api/someday/tasks`, {
    method: "POST",
    body: { calendar_id: calendarId, ...payload },
  });

export const updateTask = (calendarId, taskId, patch) =>
  apiFetch(`/api/someday/tasks/${taskId}`, {
    method: "PATCH",
    body: { calendar_id: calendarId, ...patch },
  });

export const moveToDate = (calendarId, taskId, due_date) =>
  apiFetch(`/api/someday/tasks/${taskId}/move-to-date`, {
    method: "POST",
    body: { calendar_id: calendarId, due_date },
  });

export const deleteTask = (calendarId, taskId) =>
  apiFetch(`/api/someday/tasks/${taskId}`, {
    method: "DELETE",
    body: { calendar_id: calendarId },
  });
