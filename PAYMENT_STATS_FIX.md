# Payment Stats API Fix

**Date:** 2026-01-29  
**Issue:** 500 Internal Server Error on `/api/payments/stats`

## Error Details

```
GET http://localhost:5000/api/payments/stats 500 (Internal Server Error)
```

## Root Causes

### 1. Missing Payments Table
The `payments` table was not created in the local PostgreSQL database because the migrations were only run in Docker, not on the local database.

### 2. Ambiguous Column Reference
The SQL query in `getRevenueStats` had an ambiguous column reference error:
```sql
-- ❌ BEFORE (Error: column "created_at" is ambiguous)
SUM(CASE WHEN created_at >= CURRENT_DATE THEN amount ELSE 0 END)

-- ✅ AFTER (Fixed with table alias)
SUM(CASE WHEN p.created_at >= CURRENT_DATE THEN amount ELSE 0 END)
```

Both `payments` and `orders` tables have a `created_at` column, so the query needed to specify which table's column to use.

## Solutions Applied

### 1. Created Migration Runner Script
**File:** `backend/run_migrations.js`

This script runs all database migrations on the local PostgreSQL database:
- `database/schema.sql`
- `database/migration_v2.sql`
- `database/migration_v3_actor_model.sql`
- `database/update_users_table.sql`
- `database/update_users_status.sql`
- `database/fix_all_missing_columns.sql`

**Usage:**
```bash
node backend/run_migrations.js
```

### 2. Fixed Payment Controller
**File:** `backend/controllers/paymentController.js`

**Changes in `getRevenueStats` function:**
- Prefixed all `created_at` references with table alias `p.`
- This resolves the ambiguous column reference error

```javascript
// Line 70-72 (Fixed)
SUM(CASE WHEN p.created_at >= CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue,
SUM(CASE WHEN p.created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as weekly_revenue,
SUM(CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as monthly_revenue,
```

## Verification

✅ Payments table created successfully  
✅ Stats query executes without errors  
✅ API endpoint returns proper response (even with no data)  
✅ Backend server running without errors  

## Expected Response

When there are no completed payments:
```json
{
  "stats": {
    "daily_revenue": null,
    "weekly_revenue": null,
    "monthly_revenue": null,
    "cash_transactions": "0",
    "digital_transactions": "0"
  }
}
```

When there are completed payments, the revenue fields will show actual amounts.

## Future Setup

For new developers or fresh database setups:

1. **Run all migrations:**
   ```bash
   node backend/run_migrations.js
   ```

2. **Verify database:**
   ```bash
   node backend/test_payments.js
   ```

3. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

## Related Files

- `backend/controllers/paymentController.js` - Payment API controller
- `backend/routes/payments.js` - Payment routes
- `backend/run_migrations.js` - Migration runner script
- `backend/test_payments.js` - Payment table test script
- `database/migration_v3_actor_model.sql` - Creates payments table
