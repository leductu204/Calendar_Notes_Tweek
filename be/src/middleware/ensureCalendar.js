// D:\ghichu\be\src\middleware\ensureCalendar.js
const db = require('../config/db');

module.exports = async function ensureCalendar(req, res, next) {
  try {
    const userId = req.user?.userId;
    const calId = Number(req.params.calendarId || req.query.calendarId || req.body.calendar_id);
    if (!userId || !calId) return res.status(400).json({ message: 'calendarId và token là bắt buộc' });
    const { rows } = await db.query('SELECT id FROM calendars WHERE id=$1 AND user_id=$2', [calId, userId]);
    if (!rows.length) return res.status(403).json({ message: 'Calendar không thuộc về bạn' });
    req.calendarId = calId;
    next();
  } catch (e) {
    next(e);
  }
};
