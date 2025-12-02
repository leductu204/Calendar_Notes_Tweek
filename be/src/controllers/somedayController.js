// BE: be/src/controllers/somedayController.js
const db = require('../config/db');

exports.getBoard = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const weekKey = req.query.week || '';

    let cols = (await db.query(
      'SELECT id, title, display_order FROM someday_columns WHERE calendar_id=$1 AND week_key=$2 ORDER BY display_order, id',
      [calId, weekKey]
    )).rows;

    if (!cols || cols.length === 0) {
      await db.query(
        'INSERT INTO someday_columns (calendar_id, title, display_order, week_key) VALUES ($1,$2,$3,$4)',
        [calId, 'Lịch tuần', 0, weekKey]
      );
      await db.query(
        'INSERT INTO someday_columns (calendar_id, title, display_order, week_key) VALUES ($1,$2,$3,$4)',
        [calId, '', 1, weekKey]
      );
      await db.query(
        'INSERT INTO someday_columns (calendar_id, title, display_order, week_key) VALUES ($1,$2,$3,$4)',
        [calId, '', 2, weekKey]
      );
      cols = (await db.query(
        'SELECT id, title, display_order FROM someday_columns WHERE calendar_id=$1 AND week_key=$2 ORDER BY display_order, id',
        [calId, weekKey]
      )).rows;
    }

    const tasks = (await db.query(
      `SELECT id, someday_column_id, display_order, text, notes, is_done, color,
              subtasks, attachments, repeat_info, reminder_info, links, extra_notes
       FROM tasks
       WHERE calendar_id=$1 AND due_date IS NULL AND someday_column_id IS NOT NULL
       ORDER BY someday_column_id, display_order, id`,
      [calId]
    )).rows;

    // Parse JSON fields
    const parsedTasks = tasks.map(t => ({
      ...t,
      subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks || '[]') : t.subtasks,
      attachments: typeof t.attachments === 'string' ? JSON.parse(t.attachments || '[]') : t.attachments,
      links: typeof t.links === 'string' ? JSON.parse(t.links || '[]') : t.links,
      repeat_info: typeof t.repeat_info === 'string' ? JSON.parse(t.repeat_info || '{"type":"never"}') : t.repeat_info,
      reminder_info: t.reminder_info && typeof t.reminder_info === 'string' ? JSON.parse(t.reminder_info) : t.reminder_info
    }));

    const map = {};
    cols.forEach(c => (map[c.id] = { id: c.id, title: c.title || '', tasks: [] }));
    parsedTasks.forEach(t => { if (map[t.someday_column_id]) map[t.someday_column_id].tasks.push(t); });

    res.json(Object.values(map));
  } catch (e) {
    next(e);
  }
};

exports.createColumn = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const { title = '', week_key = '' } = req.body;
    const { rows: m } = await db.query(
      'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM someday_columns WHERE calendar_id=$1',
      [calId]
    );
    const { rows } = await db.query(
      'INSERT INTO someday_columns (calendar_id, title, display_order, week_key) VALUES ($1,$2,$3,$4) RETURNING *',
      [calId, title, Number(m[0].next) || 0, week_key]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

exports.updateColumn = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    const { title } = req.body;
    const { rows } = await db.query(
      'UPDATE someday_columns SET title=COALESCE($3,title) WHERE id=$2 AND calendar_id=$1 RETURNING *',
      [calId, id, title]
    );
    res.json(rows[0] || null);
  } catch (e) { next(e); }
};

exports.deleteColumn = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    await db.query('DELETE FROM tasks WHERE someday_column_id=$1', [id]);
    await db.query('DELETE FROM someday_columns WHERE id=$1 AND calendar_id=$2', [id, calId]);
    res.status(204).end();
  } catch (e) { next(e); }
};

exports.createSomedayTask = async (req, res, next) => {
  try {
    const calId = req.calendarId;
    const {
      column_id, text = '', notes = '', is_done = false, color = '',
      subtasks = [], attachments = [], repeat_info = { type: 'never' }, reminder_info = null, links = [], extra_notes = ''
    } = req.body;
    if (!column_id) return res.status(400).json({ message: 'column_id là bắt buộc' });

    const { rows: m } = await db.query(
      'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE someday_column_id=$1',
      [Number(column_id)]
    );
    const { rows } = await db.query(
      `INSERT INTO tasks (calendar_id, someday_column_id, display_order, text, notes, is_done,
                          color, subtasks, attachments, repeat_info, reminder_info, links, extra_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [calId, Number(column_id), Number(m[0].next) || 0, text, notes, is_done, color,
       subtasks, attachments, repeat_info, reminder_info, links, extra_notes]
    );
    
    // Parse JSON fields in the response
    const task = rows[0];
    if (task) {
      task.subtasks = typeof task.subtasks === 'string' ? JSON.parse(task.subtasks || '[]') : task.subtasks;
      task.attachments = typeof task.attachments === 'string' ? JSON.parse(task.attachments || '[]') : task.attachments;
      task.links = typeof task.links === 'string' ? JSON.parse(task.links || '[]') : task.links;
      task.repeat_info = typeof task.repeat_info === 'string' ? JSON.parse(task.repeat_info || '{"type":"never"}') : task.repeat_info;
      task.reminder_info = task.reminder_info && typeof task.reminder_info === 'string' ? JSON.parse(task.reminder_info) : task.reminder_info;
    }
    
    res.status(201).json(task);
  } catch (e) { next(e); }
};

exports.updateSomedayTask = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    const { text, notes, is_done, color, subtasks, attachments, repeat_info, reminder_info, links, extra_notes } = req.body;

    const set = [];
    const params = [calId, id];
    const add = (c, v) => { if (v !== undefined) { set.push(`${c}=$${params.length + 1}`); params.push(v); } };

    add('text', text); add('notes', notes); add('is_done', is_done); add('color', color);
    add('subtasks', subtasks); add('attachments', attachments);
    add('repeat_info', repeat_info); add('reminder_info', reminder_info); add('links', links);
    add('extra_notes', extra_notes);

    if (!set.length) return res.json({ ok: true });

    const { rows } = await db.query(
      `UPDATE tasks SET ${set.join(', ')} WHERE calendar_id=$1 AND id=$2 RETURNING *`, params
    );
    
    // Parse JSON fields in the response
    const task = rows[0];
    if (task) {
      task.subtasks = typeof task.subtasks === 'string' ? JSON.parse(task.subtasks || '[]') : task.subtasks;
      task.attachments = typeof task.attachments === 'string' ? JSON.parse(task.attachments || '[]') : task.attachments;
      task.links = typeof task.links === 'string' ? JSON.parse(task.links || '[]') : task.links;
      task.repeat_info = typeof task.repeat_info === 'string' ? JSON.parse(task.repeat_info || '{"type":"never"}') : task.repeat_info;
      task.reminder_info = task.reminder_info && typeof task.reminder_info === 'string' ? JSON.parse(task.reminder_info) : task.reminder_info;
    }
    
    res.json(task || null);
  } catch (e) { next(e); }
};

exports.moveToDate = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    const { due_date } = req.body;
    if (!due_date) return res.status(400).json({ message: 'due_date là bắt buộc' });

    const { rows: m } = await db.query(
      'SELECT COALESCE(MAX(display_order), -1)+1 AS next FROM tasks WHERE calendar_id=$1 AND due_date=$2',
      [calId, due_date]
    );
    const { rows } = await db.query(
      `UPDATE tasks
       SET due_date=$3, someday_column_id=NULL, display_order=$4
       WHERE calendar_id=$1 AND id=$2
       RETURNING *`,
      [calId, id, due_date, Number(m[0].next) || 0]
    );
    res.json(rows[0] || null);
  } catch (e) { next(e); }
};

exports.deleteSomedayTask = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const calId = req.calendarId;
    await db.query('DELETE FROM tasks WHERE calendar_id=$1 AND id=$2', [calId, id]);
    res.status(204).end();
  } catch (e) { next(e); }
};
