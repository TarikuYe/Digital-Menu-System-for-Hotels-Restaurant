import pool from '../config/database.js';

const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : row[header];
            cell = cell.toString().replace(/"/g, '""');
            if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
};

export const exportOrders = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                o.id, o.table_number, o.status, o.total_amount, 
                o.payment_status, o.created_at,
                u.full_name as customer_name,
                b.name as branch_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN branches b ON o.branch_id = b.id
            ORDER BY o.created_at DESC
        `);

        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

export const exportFeedback = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                f.id, f.rating, f.comment, f.sentiment_score, f.created_at,
                u.full_name as user_name,
                fo.name as food_name
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            LEFT JOIN foods fo ON f.food_id = fo.id
            ORDER BY f.created_at DESC
        `);

        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=feedback_export.csv');
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

export const exportSalesAnalytics = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as sale_date,
                COUNT(*) as total_orders,
                SUM(total_amount) as daily_revenue,
                AVG(total_amount) as avg_order_value
            FROM orders
            WHERE status = 'served'
            GROUP BY DATE(created_at)
            ORDER BY sale_date DESC
        `);

        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_analytics.csv');
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};
