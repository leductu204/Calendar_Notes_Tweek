// be/src/config/db-sqlite.js - Temporary SQLite configuration for testing
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project directory
const dbPath = path.join(__dirname, '../../../ghichu1.db');
const db = new sqlite3.Database(dbPath);

// Initialize tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Calendars table
      db.run(`
        CREATE TABLE IF NOT EXISTS calendars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          is_default BOOLEAN DEFAULT FALSE,
          type TEXT DEFAULT 'personal',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Someday columns table
      db.run(`
        CREATE TABLE IF NOT EXISTS someday_columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          calendar_id INTEGER NOT NULL,
          title TEXT DEFAULT '',
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendar_id) REFERENCES calendars (id)
        )
      `);

      // Tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          calendar_id INTEGER NOT NULL,
          due_date DATE,
          someday_column_id INTEGER,
          display_order INTEGER DEFAULT 0,
          text TEXT DEFAULT '',
          is_done BOOLEAN DEFAULT FALSE,
          color TEXT DEFAULT '',
          subtasks TEXT DEFAULT '[]',
          attachments TEXT DEFAULT '[]',
          repeat_info TEXT DEFAULT '{"type":"never"}',
          reminder_info TEXT,
          share_info TEXT DEFAULT '{"enabled":false}',
          links TEXT DEFAULT '[]',
          extra_notes TEXT DEFAULT '',
          comments TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (calendar_id) REFERENCES calendars (id),
          FOREIGN KEY (someday_column_id) REFERENCES someday_columns (id)
        )
      `);

      // Notes table - Standalone note-taking system
      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          content TEXT DEFAULT '',
          tags TEXT DEFAULT '[]',
          extra_notes TEXT DEFAULT '',
          comments TEXT DEFAULT '[]',
          color TEXT DEFAULT '',
          is_pinned BOOLEAN DEFAULT FALSE,
          is_archived BOOLEAN DEFAULT FALSE,
          is_completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Attempt to add is_completed column if it doesn't exist (migration for existing DBs)
          db.run(`ALTER TABLE notes ADD COLUMN is_completed BOOLEAN DEFAULT FALSE`, (alterErr) => {
            // Ignore error if column already exists
          });

          // Add week_key to someday_columns
          db.run(`ALTER TABLE someday_columns ADD COLUMN week_key TEXT DEFAULT ''`, (alterErr) => {
             // Ignore error if column already exists
          });

          // Add subtasks to notes
          db.run(`ALTER TABLE notes ADD COLUMN subtasks TEXT DEFAULT '[]'`, (alterErr) => {
             // Ignore error if column already exists
          });

          // Add comments to notes
          db.run(`ALTER TABLE notes ADD COLUMN comments TEXT DEFAULT '[]'`, (alterErr) => {
             // Ignore error if column already exists
          });

          // Add comments to tasks
          db.run(`ALTER TABLE tasks ADD COLUMN comments TEXT DEFAULT '[]'`, (alterErr) => {
             // Ignore error if column already exists
             
             // Add extra_notes to tasks
             db.run(`ALTER TABLE tasks ADD COLUMN extra_notes TEXT DEFAULT ''`, () => {});
             // Add extra_notes to notes
             db.run(`ALTER TABLE notes ADD COLUMN extra_notes TEXT DEFAULT ''`, () => {
                console.log('SQLite database initialized successfully');
                resolve();
             });
          });
        }
      });
    });
  });
};

// Promise-based query function to match PostgreSQL interface
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // Convert PostgreSQL positional parameters ($1, $2) to SQLite (?)
    let sqliteSql = sql;
    if (params && params.length > 0) {
      // Replace parameters in reverse order to avoid conflicts (e.g., $10 before $1)
      for (let i = params.length; i >= 1; i--) {
        sqliteSql = sqliteSql.replace(new RegExp(`\\$${i}\\b`, 'g'), `?${i}`);
      }
    }

    // Convert objects/arrays to JSON strings for SQLite
    const processedParams = params.map(param => {
      if (typeof param === 'object' && param !== null) {
        return JSON.stringify(param);
      }
      return param;
    });

    if (sqliteSql.trim().toUpperCase().startsWith('SELECT') || /RETURNING\b/i.test(sqliteSql)) {
      db.all(sqliteSql, processedParams, (err, rows) => {
        if (err) {
          console.error('SQLite query error:', err);
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    } else {
      db.run(sqliteSql, processedParams, function (err) {
        if (err) {
          console.error('SQLite RUN error:', err);
          reject(err);
        } else {
          resolve({ rows: [], lastID: this.lastID, changes: this.changes });
        }
      });
    }
  });
};

// Initialize database on module load
initializeDatabase().catch(console.error);

module.exports = {
  query,
  pool: { end: () => db.close() }
};
