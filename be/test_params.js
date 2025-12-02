const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE test (val TEXT)");
    db.run("INSERT INTO test (val) VALUES ('hello')");

    // Test ?1 syntax
    const sql = "SELECT * FROM test WHERE val LIKE ?1 OR val LIKE ?1";
    db.all(sql, ['%hello%'], (err, rows) => {
        if (err) {
            console.log("?1 syntax failed:", err.message);
        } else {
            console.log("?1 syntax success. Rows:", rows);
        }
    });
});
