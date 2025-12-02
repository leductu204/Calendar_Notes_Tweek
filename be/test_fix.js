const db = require('./src/config/db-sqlite');

async function test() {
    try {
        console.log('Creating test table...');
        await db.query('CREATE TABLE IF NOT EXISTS test_fix (id INTEGER PRIMARY KEY, val TEXT)');

        console.log('Inserting row...');
        const { rows: insertRows } = await db.query("INSERT INTO test_fix (val) VALUES ('initial') RETURNING *");
        console.log('Insert result:', insertRows);
        const id = insertRows[0].id;

        console.log('Updating row...');
        const { rows: updateRows } = await db.query("UPDATE test_fix SET val = 'updated' WHERE id = $1 RETURNING *", [id]);
        console.log('Update result:', updateRows);

        if (updateRows.length > 0 && updateRows[0].val === 'updated' && updateRows[0].id === id) {
            console.log('SUCCESS: Update returned correct row!');
        } else {
            console.error('FAILURE: Update did not return correct row.');
        }

        console.log('Cleaning up...');
        await db.query('DROP TABLE test_fix');

    } catch (e) {
        console.error('Test failed:', e);
    }
}

// Wait for DB init
setTimeout(test, 1000);
