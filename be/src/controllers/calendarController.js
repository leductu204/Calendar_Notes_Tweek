// BE: be/src/controllers/calendarController.js
const db = require('../config/db');

exports.getCalendars = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { rows } = await db.query(
      'SELECT id, user_id, name, is_default, type, created_at FROM calendars WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error getting calendars:", error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.createCalendar = async (req, res) => {
  const userId = req.user.userId;
  const { name, type } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tên lịch là bắt buộc.' });
  }
  try {
    const query = `
      INSERT INTO calendars (user_id, name, is_default, type)
      VALUES ($1, $2, false, $3) RETURNING id, user_id, name, is_default, type, created_at;
    `;
    const { rows } = await db.query(query, [userId, name, type || 'personal']);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating calendar:", error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
