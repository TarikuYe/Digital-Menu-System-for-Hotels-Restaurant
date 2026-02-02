import pool from './config/database.js';
async function getFoods() {
    try {
        const res = await pool.query('SELECT name, description, image_url FROM foods');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
getFoods();
