const db = require('./src/config/db-sqlite');

async function test() {
    try {
        console.log('Creating test note with tag...');
        // Create a note with a specific tag
        const tag = 'calendar-2099-01-01';
        const { rows: insertRows } = await db.query(
            "INSERT INTO notes (user_id, title, content, tags) VALUES (1, 'Test Title', 'Test Content', $1) RETURNING *",
            [JSON.stringify([tag, 'line-1'])]
        );
        const noteId = insertRows[0].id;
        console.log('Created note:', noteId);

        // Debug: List all notes
        const { rows: allNotes } = await db.query('SELECT * FROM notes');
        console.log('All notes in DB:', JSON.stringify(allNotes, null, 2));

        console.log('Searching by tag...');
        // Simulate the search query used in controller
        const search = tag;
        const query = `
      SELECT id, title, content, tags 
      FROM notes 
      WHERE user_id = 1 AND (title LIKE $1 OR content LIKE $1 OR tags LIKE $1)
    `;
        const { rows: searchRows } = await db.query(query, [`%${search}%`]);
        console.log('Search results:', searchRows.length);
        console.log('Search rows:', JSON.stringify(searchRows, null, 2));

        if (searchRows.length > 0 && searchRows.some(r => r.id === noteId)) {
            console.log('SUCCESS: Found note by tag!');
        } else {
            console.error('FAILURE: Did not find note by tag.');
        }

        console.log('Cleaning up...');
        await db.query('DELETE FROM notes WHERE id = $1', [noteId]);

    } catch (e) {
        console.error('Test failed:', e);
    }
}

// Wait for DB init
setTimeout(test, 1000);
