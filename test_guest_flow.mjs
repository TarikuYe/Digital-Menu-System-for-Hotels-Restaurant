
const BASE_URL = 'http://localhost:5000/api';
const TABLE_TOKEN = 'table_1_tkn_2024';

async function testGuestFlow() {
    console.log('--- Testing Guest Flow ---');

    try {
        // 1. Verify Token
        console.log(`1. Verifying token: ${TABLE_TOKEN}`);
        const verifyRes = await fetch(`${BASE_URL}/guest/verify/${TABLE_TOKEN}`);
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) throw new Error(verifyData.error || 'Verify failed');
        console.log('   ✅ Valid Table:', verifyData.table.table_number);
        const tableId = verifyData.table.id;

        // 2. Start Session
        console.log('2. Starting Guest Session...');
        const sessionRes = await fetch(`${BASE_URL}/guest/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table_id: tableId,
                guest_name: 'Test Guest'
            })
        });
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) throw new Error(sessionData.error || 'Session start failed');

        const sessionToken = sessionData.session.session_token;
        console.log('   ✅ Session Started. Token:', sessionToken);

        // 3. Check Status (Auth)
        console.log('3. Checking Session Status (Auth)...');
        const statusRes = await fetch(`${BASE_URL}/guest/status`, {
            headers: { 'Authorization': `Guest ${sessionToken}` }
        });
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Status check failed');

        console.log('   ✅ Status Verified. User:', statusData.session.full_name);

        // 4. Create Order (Simulation)
        console.log('4. Fetching Menu to find item...');
        const menuRes = await fetch(`${BASE_URL}/foods`);
        const response = await menuRes.json();
        const menuData = response.foods || []; // Fix: API returns { foods: [...] }

        if (menuData.length > 0) {
            const foodId = menuData[0].id;
            console.log(`   Found food: ${menuData[0].name} (${foodId})`);

            console.log('5. Placing Guest Order...');
            const orderRes = await fetch(`${BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Guest ${sessionToken}`
                },
                body: JSON.stringify({
                    items: [{ food_id: foodId, quantity: 1 }],
                    table_number: '1'
                })
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error || 'Order placement failed');

            console.log('   ✅ Order Placed! Order ID:', orderData.orderId);
        } else {
            console.log('   ⚠️ No food items found to test ordering.');
        }

        console.log('\n✅ GUEST FLOW TEST PASSED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error(error.message);
    }
}

testGuestFlow();
