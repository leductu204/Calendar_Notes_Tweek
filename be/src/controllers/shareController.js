// BE: be/src/controllers/shareController.js
const db = require('../config/db');

exports.getSharedTask = async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: 'Thiếu token' });
  try {
    const q = `
      SELECT id, text, notes, color, subtasks, attachments, repeat_info, links
      FROM tasks
      WHERE share_info->>'token' = $1 AND share_info->>'enabled' = 'true'
      LIMIT 1;
    `;
    const { rows } = await db.query(q, [token]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy công việc được chia sẻ.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
