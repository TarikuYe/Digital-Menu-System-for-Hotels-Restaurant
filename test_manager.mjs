
const API_URL = 'http://localhost:5000/api';

const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!res.ok) {
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.error || `HTTP ${res.status}`);
        } catch (e) {
            throw new Error(text || `HTTP ${res.status}`);
        }
    }
    return res.json();
};

async function runTest() {
    try {
        console.log('--- STARTING MANAGER FLOW TEST ---');

        // 1. MANAGER: Login
        console.log('\n[MANAGER] Logging in as Manager...');
        const loginRes = await fetchJson(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                email: 'manager@hotel.com',
                password: 'password123'
            })
        });
        const managerToken = loginRes.token;
        const managerHeaders = { Authorization: `Bearer ${managerToken}` };
        console.log('[MANAGER] Logged in.');

        // 2. MANAGER: Get Stats
        console.log('\n[MANAGER] Fetching Dashboard Stats...');
        const stats = await fetchJson(`${API_URL}/manager/stats`, { headers: managerHeaders });
        console.log('Stats:', stats);

        if (typeof stats.revenue !== 'number' || typeof stats.totalOrders !== 'number') {
            throw new Error('Invalid stats format');
        }

        // 3. MANAGER: Get Recent Activity
        console.log('\n[MANAGER] Fetching Recent Activity...');
        const activity = await fetchJson(`${API_URL}/manager/activity`, { headers: managerHeaders });
        console.log(`Activity Items: ${activity.length}`);
        if (activity.length > 0) {
            console.log('Latest Activity:', activity[0]);
        }

        console.log('\n✅ TEST PASSED: Manager flow is working!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTest();
