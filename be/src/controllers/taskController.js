// D:\ghichu\be\src\controllers\taskController.js
const db = require('../config/db');

exports.listByRange = async (req, res, next) => {
  try {
    const calId = req.calendarId;                   // set bởi ensureCalendar
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from/to là bắt buộc (YYYY-MM-DD)' });

    const q = `
      SELECT id, calendar_id, due_date, display_order, text, notes, is_done,
             color, subtasks, attachments, repeat_info, reminder_info, share_info, links
      FROM tasks
      WHERE calendar_id=$1 AND due_date IS NOT NULL AND due_date BETWEEN $2::date AND $3::date
      ORDER BY due_date ASC, display_order ASC, id ASC`;
    const { rows } = await db.query(q, [calId, from, to]);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.createDay = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const {
      due_date, text = '', notes = '', is_done = false, color = '',
      subtasks = [], attachments = [], repeat_info = { type: 'never' },
      reminder_info = null, links = []
    } = req.body;

    if (!due_date) return res.status(400).json({ message: 'due_date là bắt buộc' });

    const { rows: m } = await db.query(
      'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE calendar_id=$1 AND due_date=$2',
      [calId, due_date]
    );
    const display_order = Number(m[0].next) || 0;

    const ins = `
      INSERT INTO tasks (calendar_id, due_date, display_order, text, notes, is_done,
                         color, subtasks, attachments, repeat_info, reminder_info, links)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`;
    const { rows } = await db.query(ins, [
      calId, due_date, display_order, text, notes, is_done,
      color, subtasks, attachments, repeat_info, reminder_info, links
    ]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;

    // move: đổi due_date ⇄ someday_column_id
    const {
      text, notes, is_done, color, subtasks, attachments, repeat_info, reminder_info, links,
      due_date, someday_column_id
    } = req.body;

    // nếu move sang ngày -> cần display_order mới
    let patchOrder = '';
    let params = [calId, id];
    let set = [];

    const add = (col, val) => {
      if (val === undefined) return;
      set.push(`${col}=$${params.length + 1}`);
      params.push(val);
    };

    add('text', text);
    add('notes', notes);
    add('is_done', is_done);
    add('color', color);
    add('subtasks', subtasks);
    add('attachments', attachments);
    add('repeat_info', repeat_info);
    add('reminder_info', reminder_info);
    add('links', links);

    if (due_date !== undefined || someday_column_id !== undefined) {
      // xác định target
      if (due_date) {
        // move sang ngày -> clear column + tính display_order
        const { rows: m } = await db.query(
          'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE calendar_id=$1 AND due_date=$2',
          [calId, due_date]
        );
        patchOrder = `, display_order=${Number(m[0].next) || 0}, someday_column_id=NULL`;
        set.push(`due_date=$${params.length + 1}`);
        params.push(due_date);
      } else if (someday_column_id) {
        set.push(`someday_column_id=$${params.length + 1}`);
        params.push(Number(someday_column_id));
        patchOrder = ', due_date=NULL';
        // display_order khi về column:
        const { rows: m2 } = await db.query(
          'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE someday_column_id=$1',
          [Number(someday_column_id)]
        );
        patchOrder += `, display_order=${Number(m2[0].next) || 0}`;
      }
    }

    if (!set.length && !patchOrder) return res.json({ ok: true });

    const sql = `
      UPDATE tasks
      SET ${set.join(', ')}${patchOrder}
      WHERE calendar_id=$1 AND id=$2
      RETURNING *`;
    const { rows } = await db.query(sql, params);
    res.json(rows[0] || null);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    await db.query('DELETE FROM tasks WHERE calendar_id=$1 AND id=$2', [calId, id]);
    res.status(204).end();
  } catch (e) { next(e); }
};
