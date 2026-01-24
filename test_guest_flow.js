
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const TABLE_TOKEN = 'table_1_tkn_2024';

async function testGuestFlow() {
    console.log('--- Testing Guest Flow ---');

    try {
        // 1. Verify Token
        console.log(`1. Verifying token: ${TABLE_TOKEN}`);
        const verifyRes = await axios.get(`${BASE_URL}/guest/verify/${TABLE_TOKEN}`);
        console.log('   ✅ Valid Table:', verifyRes.data.table.table_number);
        const tableId = verifyRes.data.table.id;

        // 2. Start Session
        console.log('2. Starting Guest Session...');
        const sessionRes = await axios.post(`${BASE_URL}/guest/session`, {
            table_id: tableId,
            guest_name: 'Test Guest'
        });
        const sessionToken = sessionRes.data.session.session_token;
        console.log('   ✅ Session Started. Token:', sessionToken);

        // 3. Check Status (Auth)
        console.log('3. Checking Session Status (Auth)...');
        const statusRes = await axios.get(`${BASE_URL}/guest/status`, {
            headers: { 'Authorization': `Guest ${sessionToken}` }
        });
        console.log('   ✅ Status Verified. User:', statusRes.data.session.full_name);

        // 4. Create Order (Simulation)
        // We need a valid food item. Let's fetch menus first.
        console.log('4. Fetching Menu to find item...');
        const menuRes = await axios.get(`${BASE_URL}/foods`);
        if (menuRes.data.length > 0) {
            const foodId = menuRes.data[0].id;
            console.log(`   Found food: ${menuRes.data[0].name} (${foodId})`);

            console.log('5. Placing Guest Order...');
            const orderRes = await axios.post(`${BASE_URL}/orders`, {
                items: [{ food_id: foodId, quantity: 1 }],
                table_number: '1' // Optional as it serves as override or confirmation
            }, {
                headers: { 'Authorization': `Guest ${sessionToken}` }
            });
            console.log('   ✅ Order Placed! Order ID:', orderRes.data.orderId);
        } else {
            console.log('   ⚠️ No food items found to test ordering.');
        }

        console.log('\n✅ GUEST FLOW TEST PASSED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else {
            console.error(error.message);
        }
    }
}

testGuestFlow();
