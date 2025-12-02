const db = require('./src/config/db-sqlite');

async function checkOwner() {
  try {
    const res = await db.query("SELECT user_id FROM calendars WHERE id=24");
    if (res.rows.length > 0) {
      const fs = require('fs');
      fs.writeFileSync('owner.txt', JSON.stringify(res.rows[0]));
      console.log('Written to owner.txt');
    } else {
      console.log('Calendar 24 not found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    db.pool.end();
  }
}

checkOwner();
