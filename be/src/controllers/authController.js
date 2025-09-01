// be/src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const newUserQuery = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3) RETURNING id, name, email;`;
    const { rows } = await db.query(newUserQuery, [name, email, password_hash]);
    const user = rows[0];

    // tạo 1 calendar mặc định
    const newCalendarQuery = `
      INSERT INTO calendars (user_id, name, is_default, type)
      VALUES ($1, $2, true, 'personal') RETURNING id;`;
    await db.query(newCalendarQuery, [user.id, 'Lịch của tôi']);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email đã tồn tại.'});
    }
    res.status(500).json({ message: 'Lỗi đăng ký tài khoản.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu.' });
  }
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || user.password_hash.startsWith('google_')) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userResponse = { id: user.id, name: user.name, email: user.email };
    res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi đăng nhập.' });
  }
};

// NEW: xác thực token & trả về user (dùng để bootstrap phiên sau F5)
exports.me = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Không có token.' });

    const { rows } = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy user.' });
    res.json({ user: rows[0] });
  } catch (e) {
    console.error('auth.me error', e);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
