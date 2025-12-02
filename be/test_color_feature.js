const API_URL = 'http://localhost:4000/api';
let authToken = '';
let userId = '';
let noteId = '';

async function runTest() {
    try {
        console.log('Starting Color Feature Test...');

        // Helper for fetch requests
        const request = async (endpoint, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await res.json().catch(() => ({}));
            return { status: res.status, data, ok: res.ok };
        };

        // 1. Login/Register to get token
        console.log('\n1. Authenticating...');
        let authRes = await request('/auth/login', 'POST', {
            email: 'test@example.com',
            password: 'password123'
        });

        if (!authRes.ok) {
            console.log('Login failed, trying register...');
            authRes = await request('/auth/register', 'POST', {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            });
        }

        if (!authRes.ok) throw new Error('Authentication failed');

        authToken = authRes.data.token;
        userId = authRes.data.user.id;
        console.log('Authenticated successfully.');

        // 2. Create a note
        console.log('\n2. Creating a note...');
        const createRes = await request('/notes', 'POST', {
            title: 'Color Test Note',
            content: 'Testing color feature',
            color: 'white' // Default
        }, authToken);

        if (!createRes.ok) throw new Error('Failed to create note');
        noteId = createRes.data.id;
        console.log('Note created:', noteId);

        // 3. Update color to 'rose'
        console.log('\n3. Updating color to "rose"...');
        const updateRes = await request(`/notes/${noteId}/color`, 'PATCH', {
            color: 'rose'
        }, authToken);

        if (updateRes.data.color === 'rose') {
            console.log('SUCCESS: Color updated to rose');
        } else {
            console.error('FAILURE: Color update failed', updateRes.data);
        }

        // 4. Verify persistence (get note)
        console.log('\n4. Verifying persistence...');
        const getRes = await request(`/notes/${noteId}`, 'GET', null, authToken);
        if (getRes.data.color === 'rose') {
            console.log('SUCCESS: Color persisted as rose');
        } else {
            console.error('FAILURE: Color persistence failed', getRes.data);
        }

        // 5. Try invalid color
        console.log('\n5. Testing invalid color...');
        const invalidRes = await request(`/notes/${noteId}/color`, 'PATCH', {
            color: 'invalid-color'
        }, authToken);

        if (invalidRes.status === 400) {
            console.log('SUCCESS: Invalid color rejected (400)');
        } else {
            console.error('FAILURE: Unexpected response for invalid color', invalidRes.status);
        }

        // 6. Cleanup
        console.log('\n6. Cleaning up...');
        await request(`/notes/${noteId}`, 'DELETE', null, authToken);
        console.log('Note deleted.');

        console.log('\nTest Complete.');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

runTest();
