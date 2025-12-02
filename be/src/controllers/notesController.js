// BE: be/src/controllers/notesController.js
const db = require('../config/db');

exports.listNotes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { archived = false, search = '' } = req.query;

    let query = `
      SELECT id, title, content, tags, color, is_pinned, is_archived, is_completed, subtasks, extra_notes, created_at, updated_at
      FROM notes 
      WHERE user_id = $1 AND is_archived = $2
    `;
    const params = [userId, archived === 'true'];

    if (search) {
      query += ' AND (title LIKE $3 OR content LIKE $3 OR tags LIKE $3)';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY is_pinned DESC, updated_at DESC';

    const { rows } = await db.query(query, params);

    // Parse JSON fields
    const notes = rows.map(note => ({
      ...note,
      tags: typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : note.tags,
      tags: typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : note.tags,
      subtasks: typeof note.subtasks === 'string' ? JSON.parse(note.subtasks || '[]') : note.subtasks,
      subtasks: typeof note.subtasks === 'string' ? JSON.parse(note.subtasks || '[]') : note.subtasks
    }));

    res.json(notes);
  } catch (e) {
    next(e);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      title = '',
      content = '',
      tags = [],
      color = '',
      is_pinned = false,
      is_completed = false,
      subtasks = [],
      extra_notes = ''
    } = req.body;

    const query = `
      INSERT INTO notes (user_id, title, content, tags, color, is_pinned, is_completed, subtasks, extra_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      userId, title, content, tags, color, is_pinned, is_completed, JSON.stringify(subtasks), extra_notes
    ]);

    const note = {
      ...rows[0],
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks
    };

    res.status(201).json(note);
  } catch (e) {
    next(e);
  }
};

exports.getNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const noteId = Number(req.params.id);

    const { rows } = await db.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = {
      ...rows[0],
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks
    };

    res.json(note);
  } catch (e) {
    next(e);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const noteId = Number(req.params.id);
    const { title, content, tags, color, is_pinned, is_archived, is_completed, subtasks, extra_notes } = req.body;

    // Build update fields dynamically
    const fields = [];
    const values = [userId, noteId];
    let paramIndex = 3;

    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(tags));
    }
    if (color !== undefined) {
      fields.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (is_pinned !== undefined) {
      fields.push(`is_pinned = $${paramIndex++}`);
      values.push(is_pinned);
    }
    if (is_archived !== undefined) {
      fields.push(`is_archived = $${paramIndex++}`);
      values.push(is_archived);
    }
    if (is_completed !== undefined) {
      fields.push(`is_completed = $${paramIndex++}`);
      values.push(is_completed);
    }
    if (subtasks !== undefined) {
      fields.push(`subtasks = $${paramIndex++}`);
      values.push(JSON.stringify(subtasks));
    }
    if (extra_notes !== undefined) {
      fields.push(`extra_notes = $${paramIndex++}`);
      values.push(extra_notes);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE notes 
      SET ${fields.join(', ')}
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = {
      ...rows[0],
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks,
      subtasks: typeof rows[0].subtasks === 'string' ? JSON.parse(rows[0].subtasks || '[]') : rows[0].subtasks
    };

    res.json(note);
  } catch (e) {
    next(e);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    const userId = req.user.userId;  // JWT contains 'userId', not 'id'
    const noteId = Number(req.params.id);

    const { changes } = await db.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    );

    if (changes === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
};

exports.updateColor = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const noteId = Number(req.params.id);
    const { color } = req.body;

    const validColors = ['rose', 'yellow', 'violet', 'slate'];
    if (!validColors.includes(color)) {
      return res.status(400).json({ message: 'Invalid color' });
    }

    const query = `
      UPDATE notes
      SET color = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND id = $3
      RETURNING *
    `;

    const { rows } = await db.query(query, [color, userId, noteId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = {
      ...rows[0],
      tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags
    };

    res.json(note);
  } catch (e) {
    next(e);
  }
};

exports.bulkAction = async (req, res, next) => {
  try {
    const userId = req.user.userId;  // JWT contains 'userId', not 'id'
    const { noteIds, action, data } = req.body;

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: 'noteIds must be a non-empty array' });
    }

    const placeholders = noteIds.map((_, i) => `$${i + 2}`).join(',');

    let query, params;

    switch (action) {
      case 'archive':
        query = `UPDATE notes SET is_archived = $${noteIds.length + 2}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds, true];
        break;
      case 'unarchive':
        query = `UPDATE notes SET is_archived = $${noteIds.length + 2}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds, false];
        break;
      case 'pin':
        query = `UPDATE notes SET is_pinned = $${noteIds.length + 2}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds, true];
        break;
      case 'unpin':
        query = `UPDATE notes SET is_pinned = $${noteIds.length + 2}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds, false];
        break;
      case 'delete':
        query = `DELETE FROM notes WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds];
        break;
      case 'color':
        if (!data || typeof data.color !== 'string') {
          return res.status(400).json({ message: 'Color data is required for color action' });
        }
        query = `UPDATE notes SET color = $${noteIds.length + 2}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id IN (${placeholders}) RETURNING id`;
        params = [userId, ...noteIds, data.color];
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const { rows } = await db.query(query, params);

    res.json({
      success: true,
      affectedCount: rows.length,
      affectedIds: rows.map(row => row.id)
    });
  } catch (e) {
    next(e);
  }
};
