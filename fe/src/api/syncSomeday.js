// fe/src/api/syncSomeday.js
import * as Someday from './someday';
import * as API from './index'; // để dùng storage.getToken/getActiveCalendarId nếu cần

function hasAuth() {
  try {
    return !!API.storage.getToken() && !!API.storage.getActiveCalendarId();
  } catch { return false; }
}

export const syncSomeday = {
  authed() {
    return hasAuth();
  },

  async pull(calendarId) {
    if (!this.authed()) return [];
    const cols = await Someday.board(calendarId);
    return Array.isArray(cols) ? cols : [];
  },

  async ensureThreeColumns(calendarId) {
    if (!this.authed()) return;
    const cols = await this.pull(calendarId);
    if (cols.length > 0) return cols;

    // seed 3 cột rỗng trên server
    await Someday.createColumn(calendarId, { title: '' });
    await Someday.createColumn(calendarId, { title: '' });
    await Someday.createColumn(calendarId, { title: '' });
    return await this.pull(calendarId);
  },

  // ---- Columns
  async createColumn(calendarId, title = '') {
    if (!this.authed()) return null;
    return await Someday.createColumn(calendarId, { title });
  },
  async renameColumn(calendarId, id, title) {
    if (!this.authed()) return;
    await Someday.updateColumn(calendarId, id, { title });
  },
  async deleteColumn(calendarId, id) {
    if (!this.authed()) return;
    await Someday.deleteColumn(calendarId, id);
  },

  // ---- Tasks
  async createTask(calendarId, columnId, row, afterIndex) {
    if (!this.authed()) return null;
    // backend nhận { calendar_id, column_id?, ...payload, after_index? }
    return await Someday.createTask(calendarId, { ...row, column_id: columnId, after_index: afterIndex });
  },
  async updateTask(calendarId, id, patch) {
    if (!this.authed()) return;
    await Someday.updateTask(calendarId, id, patch);
  },
  async deleteTask(calendarId, id) {
    if (!this.authed()) return;
    await Someday.deleteTask(calendarId, id);
  },
  async moveToDate(calendarId, id, due_date) {
    if (!this.authed()) return;
    await Someday.moveToDate(calendarId, id, due_date);
  },
};
