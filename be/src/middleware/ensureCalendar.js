// BE: be/src/middleware/ensureCalendar.js
const db = require('../config/db');

module.exports = async function ensureCalendar(req, res, next) {
  try {
    const userId = req.user?.userId;

    // ƯU TIÊN: header -> params -> query -> body
    let calIdRaw =
      req.header('X-Calendar-Id') ||
      req.params.calendarId ||
      req.query.calendarId ||
      req.body.calendar_id ||
      null;

    let calId = calIdRaw ? Number(calIdRaw) : null;

    if (!userId) {
      return res.status(401).json({ message: 'calendarId và token là bắt buộc' });
    }

    // Nếu chưa có calendarId mà có taskId thì lookup calendar từ task
    if (!calId && req.params?.id) {
      const { rows } = await db.query(
        'SELECT calendar_id FROM tasks WHERE id=$1 LIMIT 1',
        [Number(req.params.id)]
      );
      calId = rows?.[0]?.calendar_id || null;
    }

    if (!calId) {
      return res.status(400).json({ message: 'calendarId và token là bắt buộc' });
    }

    const { rows } = await db.query(
      'SELECT id FROM calendars WHERE id=$1 AND user_id=$2',
      [calId, userId]
    );
    if (!rows.length) {
      return res.status(403).json({ message: 'Calendar không thuộc về bạn' });
    }

    req.calendarId = calId;
    next();
  } catch (e) {
    next(e);
  }
};
