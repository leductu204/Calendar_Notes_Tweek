const db = require('./src/config/db-sqlite');

async function testPersistence() {
  try {
    console.log('Starting persistence test...');

    // 1. Create a dummy calendar
    console.log('Creating dummy calendar...');
    const calRes = await db.query(
      "INSERT INTO calendars (user_id, name) VALUES (1, 'Test Cal') RETURNING *"
    );
    const calId = calRes.rows[0].id;
    console.log('Created Calendar ID:', calId);

    // 2. Create a dummy column
    console.log('Creating dummy column...');
    const colRes = await db.query(
      "INSERT INTO someday_columns (calendar_id, title) VALUES ($1, 'Test Col') RETURNING *",
      [calId]
    );
    const colId = colRes.rows[0].id;
    console.log('Created Column ID:', colId);

    // 3. Create a task WITHOUT extra_notes
    console.log('Creating task...');
    const taskRes = await db.query(
      "INSERT INTO tasks (calendar_id, someday_column_id, text) VALUES ($1, $2, 'Test Task') RETURNING *",
      [calId, colId]
    );
    const taskId = taskRes.rows[0].id;
    console.log('Created Task ID:', taskId);

    // 4. Update task WITH extra_notes
    console.log('Updating task with extra_notes...');
    const extraNotes = "This is a test note <div><br></div>";
    const updateRes = await db.query(
      "UPDATE tasks SET extra_notes=$1 WHERE id=$2 RETURNING *",
      [extraNotes, taskId]
    );
    console.log('Update Result:', updateRes.rows[0]);

    // 5. Read task back
    console.log('Reading task back...');
    const readRes = await db.query(
      "SELECT * FROM tasks WHERE id=$1",
      [taskId]
    );
    const readTask = readRes.rows[0];
    console.log('Read Task:', readTask);

    if (readTask.extra_notes === extraNotes) {
      console.log('SUCCESS: extra_notes persisted correctly!');
    } else {
      console.error('FAILURE: extra_notes did NOT persist. Expected:', extraNotes, 'Got:', readTask.extra_notes);
    }

    // Cleanup
    await db.query("DELETE FROM tasks WHERE id=$1", [taskId]);
    await db.query("DELETE FROM someday_columns WHERE id=$1", [colId]);
    await db.query("DELETE FROM calendars WHERE id=$1", [calId]);

  } catch (e) {
    console.error('Test Failed:', e);
  } finally {
    db.pool.end();
  }
}

testPersistence();
