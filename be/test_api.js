const fetch = require('node-fetch');

async function testApi() {
  try {
    console.log('Starting API test...');
    
    // We need a valid task ID. 
    // Since we don't know one, let's try to create one first via API.
    // Or we can assume ID 71 from the user's screenshot exists.
    
    // 1. Create a task via API (Someday)
    // We need a calendar ID. User logs showed calendarId=24.
    const calendarId = 24;
    
    // First, get the board to find a column ID
    console.log('Fetching board...');
    const boardRes = await fetch(`http://localhost:4000/api/someday?calendarId=${calendarId}`);
    if (!boardRes.ok) throw new Error('Failed to fetch board: ' + boardRes.statusText);
    const board = await boardRes.json();
    
    if (board.length === 0) throw new Error('No columns found');
    const columnId = board[0].id;
    console.log('Using Column ID:', columnId);
    
    // Create task
    console.log('Creating task...');
    const createRes = await fetch('http://localhost:4000/api/someday/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendar_id: calendarId,
        column_id: columnId,
        text: 'API Test Task'
      })
    });
    if (!createRes.ok) throw new Error('Failed to create task: ' + createRes.statusText);
    const task = await createRes.json();
    console.log('Created Task ID:', task.id);
    
    // 2. Update task with extra_notes
    console.log('Updating task with extra_notes...');
    const extraNotes = "API Test Note <div><br></div>";
    const updateRes = await fetch(`http://localhost:4000/api/someday/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendar_id: calendarId,
        extra_notes: extraNotes
      })
    });
    if (!updateRes.ok) throw new Error('Failed to update task: ' + updateRes.statusText);
    const updatedTask = await updateRes.json();
    console.log('Update Response extra_notes:', updatedTask.extra_notes);
    
    // 3. Verify via GET
    console.log('Verifying via GET...');
    // We can just fetch the board again and find the task
    const boardRes2 = await fetch(`http://localhost:4000/api/someday?calendarId=${calendarId}`);
    const board2 = await boardRes2.json();
    
    let foundTask = null;
    for (const col of board2) {
      const t = col.tasks.find(t => t.id === task.id);
      if (t) {
        foundTask = t;
        break;
      }
    }
    
    if (foundTask) {
      console.log('GET Task extra_notes:', foundTask.extra_notes);
      if (foundTask.extra_notes === extraNotes) {
        console.log('SUCCESS: API persistence verified!');
      } else {
        console.error('FAILURE: API persistence failed. Expected:', extraNotes, 'Got:', foundTask.extra_notes);
      }
    } else {
      console.error('FAILURE: Task not found in board after update');
    }

  } catch (e) {
    console.error('Test Failed:', e);
  }
}

testApi();
