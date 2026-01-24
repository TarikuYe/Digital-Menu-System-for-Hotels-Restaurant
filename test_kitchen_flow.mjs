
const API_URL = 'http://localhost:5000/api';
const TABLE_TOKEN = 'table_1_tkn_2024';

// Helpers
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
        console.log('--- STARTING KITCHEN FLOW TEST ---');

        // 1. GUEST: Verify Token & Start Session
        console.log('\n[GUEST] Verifying table token...');
        const verifyRes = await fetchJson(`${API_URL}/guest/verify/${TABLE_TOKEN}`);
        console.log('Verify Response:', JSON.stringify(verifyRes));
        const tableId = verifyRes.table?.id;
        if (!tableId) throw new Error('Table ID missing');
        console.log(`[GUEST] Table verified: ID ${tableId}`);

        console.log('[GUEST] Starting session...');
        const sessionRes = await fetchJson(`${API_URL}/guest/session`, {
            method: 'POST',
            body: JSON.stringify({
                table_id: tableId,
                guest_name: 'Test Hungry Guest'
            })
        });
        console.log('Session Response:', JSON.stringify(sessionRes));
        const guestToken = sessionRes.session?.session_token;
        if (!guestToken) throw new Error('Token missing');
        console.log(`[GUEST] Session started. Token: ${guestToken.substring(0, 10)}...`);

        const guestHeaders = { Authorization: `Guest ${guestToken}` };

        // 2. GUEST: Place Order
        // Need a food item first.
        console.log('\n[GUEST] Fetching menu...');
        const foodResponse = await fetchJson(`${API_URL}/foods`);
        // Fix: foodResponse is { foods: [], count: ... } or just array (legacy?)
        // But currently controller returns { foods: [...] }
        const foods = foodResponse.foods || foodResponse;

        if (!Array.isArray(foods)) {
            console.log('Unexpected foods response structure:', JSON.stringify(foodResponse));
            throw new Error('Foods is not an array');
        }

        console.log(`[GUEST] Foods found: ${foods.length}`);
        if (foods.length === 0) throw new Error('No foods found');
        const foodId = foods[0].id;
        const foodPrice = foods[0].price;

        console.log(`[GUEST] Placing order for food ID: ${foodId}`);
        const orderRes = await fetchJson(`${API_URL}/orders`, {
            method: 'POST',
            headers: guestHeaders,
            body: JSON.stringify({
                items: [{ food_id: foodId, quantity: 2, special_instructions: 'Extra crispy' }],
                total_amount: foodPrice * 2
            })
        });

        // Fix: orderController returns { message, orderId }
        // Test logic must robustly extract ID
        const orderId = orderRes.orderId || (orderRes.order ? orderRes.order.id : orderRes.id);
        console.log(`[GUEST] Order placed: ${orderId}`);

        if (!orderId) throw new Error('Order ID is missing from response: ' + JSON.stringify(orderRes));


        // 3. KITCHEN: Login
        console.log('\n[KITCHEN] Logging in as Kitchen Staff...');
        const loginRes = await fetchJson(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                email: 'kitchen@hotel.com',
                password: 'password123'
            })
        });
        const kitchenToken = loginRes.token;
        const kitchenHeaders = { Authorization: `Bearer ${kitchenToken}` };
        console.log('[KITCHEN] Logged in.');

        // 4. KITCHEN: Get Orders
        console.log('[KITCHEN] Fetching pending orders...');
        let orders = await fetchJson(`${API_URL}/kitchen/orders`, { headers: kitchenHeaders });
        let myOrder = orders.find(o => o.id === orderId);

        if (!myOrder) throw new Error(`Order ${orderId} not found in kitchen queue! Found IDs: ${orders.map(o => o.id).join(', ')}`);
        console.log(`[KITCHEN] Found order. Status: ${myOrder.status}`);

        if (myOrder.status !== 'pending') throw new Error(`Expected pending, got ${myOrder.status}`);

        // 5. KITCHEN: Update to Preparing
        console.log('[KITCHEN] Updating to "preparing"...');
        await fetchJson(`${API_URL}/kitchen/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: kitchenHeaders,
            body: JSON.stringify({ status: 'preparing' })
        });

        // Verify
        orders = await fetchJson(`${API_URL}/kitchen/orders`, { headers: kitchenHeaders });
        myOrder = orders.find(o => o.id === orderId);
        console.log(`[KITCHEN] Order status is now: ${myOrder.status}`);
        if (myOrder.status !== 'preparing') throw new Error('Update failed');

        // 6. KITCHEN: Update to Ready
        console.log('[KITCHEN] Updating to "ready"...');
        await fetchJson(`${API_URL}/kitchen/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: kitchenHeaders,
            body: JSON.stringify({ status: 'ready' })
        });

        orders = await fetchJson(`${API_URL}/kitchen/orders`, { headers: kitchenHeaders });
        myOrder = orders.find(o => o.id === orderId);
        console.log(`[KITCHEN] Order status is now: ${myOrder.status}`);
        if (myOrder.status !== 'ready') throw new Error('Update failed');

        console.log('\n✅ TEST PASSED: Kitchen flow is working!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        process.exit(1);
    }
}

runTest();
