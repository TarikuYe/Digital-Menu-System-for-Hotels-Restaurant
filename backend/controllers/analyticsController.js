import pool from '../config/database.js';

export const getSalesPerformance = async (req, res, next) => {
    try {
        // 1. Best Selling Items
        const bestSellingQuery = `
            SELECT f.name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
            FROM order_items oi
            JOIN foods f ON oi.food_id = f.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY f.id, f.name
            ORDER BY total_sold DESC
            LIMIT 10
        `;
        const bestSelling = await pool.query(bestSellingQuery);

        // 2. Low Performing Items (Bottom 10)
        const lowPerformingQuery = `
            SELECT f.name, COALESCE(SUM(oi.quantity), 0) as total_sold
            FROM foods f
            LEFT JOIN order_items oi ON f.id = oi.food_id
            LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
            GROUP BY f.id, f.name
            ORDER BY total_sold ASC
            LIMIT 10
        `;
        const lowPerforming = await pool.query(lowPerformingQuery);

        // 3. Peak Ordering Times (Hour of day)
        const peakTimesQuery = `
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as order_count
            FROM orders
            WHERE status != 'cancelled'
            GROUP BY hour
            ORDER BY hour ASC
        `;
        const peakTimes = await pool.query(peakTimesQuery);

        // 4. Revenue Trends (Last 30 days)
        const revenueTrendsQuery = `
            SELECT DATE_TRUNC('day', created_at) as date, SUM(total_amount) as revenue
            FROM orders
            WHERE status != 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY date
            ORDER BY date ASC
        `;
        const revenueTrends = await pool.query(revenueTrendsQuery);

        res.json({
            bestSelling: bestSelling.rows,
            lowPerforming: lowPerforming.rows,
            peakTimes: peakTimes.rows,
            revenueTrends: revenueTrends.rows
        });
    } catch (error) {
        next(error);
    }
};

export const getCustomerBehavior = async (req, res, next) => {
    try {
        // 1. Popular among Tourists (High guest session orders)
        const touristFavsQuery = `
            SELECT f.name, COUNT(*) as order_count
            FROM order_items oi
            JOIN foods f ON oi.food_id = f.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.guest_session_id IS NOT NULL AND o.status != 'cancelled'
            GROUP BY f.id, f.name
            ORDER BY order_count DESC
            LIMIT 10
        `;
        const touristFavs = await pool.query(touristFavsQuery);

        // 2. Preferences Popularity (Vegetarian, Non-spicy, etc.)
        const preferenceQuery = `
            SELECT 
                SUM(CASE WHEN f.is_vegetarian THEN oi.quantity ELSE 0 END) as vegetarian_sold,
                SUM(CASE WHEN f.is_vegan THEN oi.quantity ELSE 0 END) as vegan_sold,
                SUM(CASE WHEN f.is_gluten_free THEN oi.quantity ELSE 0 END) as gluten_free_sold,
                SUM(CASE WHEN f.spice_level = 0 THEN oi.quantity ELSE 0 END) as non_spicy_sold
            FROM order_items oi
            JOIN foods f ON oi.food_id = f.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
        `;
        const preferences = await pool.query(preferenceQuery);

        // 3. Repeat Customer analysis (Customers with more than 1 order)
        const repeatCustomersQuery = `
            WITH customer_order_counts AS (
                SELECT user_id, COUNT(*) as order_count
                FROM orders
                WHERE user_id IS NOT NULL AND status != 'cancelled'
                GROUP BY user_id
            )
            SELECT 
                COUNT(*) as total_customers,
                SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) as repeat_customers
            FROM customer_order_counts
        `;
        const repeatCustomers = await pool.query(repeatCustomersQuery);

        res.json({
            touristFavorites: touristFavs.rows,
            preferences: preferences.rows[0],
            customerLoyalty: repeatCustomers.rows[0]
        });
    } catch (error) {
        next(error);
    }
};
