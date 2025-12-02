// BE: be/src/controllers/taskController.js
const db = require('../config/db');

exports.listByRange = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: 'from/to là bắt buộc (YYYY-MM-DD)' });

    const q = `
      SELECT id, calendar_id, due_date, display_order, text, is_done,
             color, subtasks, attachments, repeat_info, reminder_info, share_info, links, extra_notes
      FROM tasks
      WHERE calendar_id=$1 AND due_date IS NOT NULL AND due_date BETWEEN $2 AND $3
      ORDER BY due_date ASC, display_order ASC, id ASC`;
    const { rows } = await db.query(q, [calId, from, to]);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.createDay = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const {
      due_date, text = '', is_done = false, color = '',
      subtasks = [], attachments = [], repeat_info = { type: 'never' },
      reminder_info = null, links = [], extra_notes = ''
    } = req.body;

    if (!due_date) return res.status(400).json({ message: 'due_date là bắt buộc' });

    const { rows: m } = await db.query(
      'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE calendar_id=$1 AND due_date=$2',
      [calId, due_date]
    );
    const display_order = Number(m[0].next) || 0;

    const ins = `
      INSERT INTO tasks (calendar_id, due_date, display_order, text, is_done,
                         color, subtasks, attachments, repeat_info, reminder_info, links, extra_notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`;
    const { rows } = await db.query(ins, [
      calId, due_date, display_order, text, is_done,
      color, subtasks, attachments, repeat_info, reminder_info, links, extra_notes
    ]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;

    const {
      text, is_done, color, subtasks, attachments, repeat_info, reminder_info, links,
      due_date, someday_column_id, extra_notes
    } = req.body;

    // Build update fields and parameters carefully
    const fields = [];
    const values = [calId, id]; // Start with calendar_id and id
    let paramIndex = 3; // Next parameter will be $3

    if (text !== undefined) {
      fields.push(`text=$${paramIndex++}`);
      values.push(text);
    }
    if (is_done !== undefined) {
      fields.push(`is_done=$${paramIndex++}`);
      values.push(is_done);
    }
    if (color !== undefined) {
      fields.push(`color=$${paramIndex++}`);
      values.push(color);
    }
    if (subtasks !== undefined) {
      fields.push(`subtasks=$${paramIndex++}`);
      values.push(subtasks);
    }
    if (attachments !== undefined) {
      fields.push(`attachments=$${paramIndex++}`);
      values.push(attachments);
    }
    if (repeat_info !== undefined) {
      fields.push(`repeat_info=$${paramIndex++}`);
      values.push(repeat_info);
    }
    if (reminder_info !== undefined) {
      fields.push(`reminder_info=$${paramIndex++}`);
      values.push(reminder_info);
    }
    if (links !== undefined) {
      fields.push(`links=$${paramIndex++}`);
      values.push(links);
    }
    if (extra_notes !== undefined) {
      fields.push(`extra_notes=$${paramIndex++}`);
      values.push(extra_notes);
    }

    // Handle due_date and someday_column_id changes
    if (due_date !== undefined) {
      const { rows: m } = await db.query(
        'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE calendar_id=$1 AND due_date=$2',
        [calId, due_date]
      );
      fields.push(`due_date=$${paramIndex++}`);
      values.push(due_date);
      fields.push(`display_order=$${paramIndex++}`);
      values.push(Number(m[0].next) || 0);
      fields.push(`someday_column_id=$${paramIndex++}`);
      values.push(null);
    } else if (someday_column_id !== undefined) {
      const { rows: m2 } = await db.query(
        'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE someday_column_id=$1',
        [Number(someday_column_id)]
      );
      fields.push(`someday_column_id=$${paramIndex++}`);
      values.push(Number(someday_column_id));
      fields.push(`due_date=$${paramIndex++}`);
      values.push(null);
      fields.push(`display_order=$${paramIndex++}`);
      values.push(Number(m2[0].next) || 0);
    }

    if (fields.length === 0) {
      return res.json({ ok: true });
    }

    const sql = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE calendar_id=$1 AND id=$2
      RETURNING *`;
    const { rows } = await db.query(sql, values);
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

exports.moveOverdue = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    // Client should send their "today" to account for timezone
    const { today } = req.body; 
    if (!today) return res.status(400).json({ message: 'today (YYYY-MM-DD) is required' });

    const sql = `
      UPDATE tasks
      SET due_date = $2
      WHERE calendar_id = $1
        AND due_date < $2
        AND is_done = false
        AND due_date IS NOT NULL
    `;
    const result = await db.query(sql, [calId, today]);
    res.json({ updated: result.rowCount || result.changes || 0 });
  } catch (e) { next(e); }
};
