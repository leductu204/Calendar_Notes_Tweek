const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../ghichu1.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("Checking 'tasks' table schema:");
  db.all("PRAGMA table_info(tasks)", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    const hasExtraNotes = rows.some(r => r.name === 'extra_notes');
    console.log('Columns:', rows.map(r => r.name).join(', '));
    console.log('Has extra_notes:', hasExtraNotes);
  });

  console.log("\nChecking 'notes' table schema:");
  db.all("PRAGMA table_info(notes)", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    const hasExtraNotes = rows.some(r => r.name === 'extra_notes');
    console.log('Columns:', rows.map(r => r.name).join(', '));
    console.log('Has extra_notes:', hasExtraNotes);
  });
});

db.close();
