const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, val TEXT)");
  db.run("INSERT INTO test (val) VALUES ('initial')", function(err) {
    if (err) console.error(err);
    console.log("Inserted id:", this.lastID);
    
    // Try UPDATE with RETURNING using db.all
    const sql = "UPDATE test SET val = 'updated' WHERE id = 1 RETURNING *";
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.log("UPDATE RETURNING failed:", err.message);
      } else {
        console.log("UPDATE RETURNING success. Rows:", rows);
      }
    });
  });
});
