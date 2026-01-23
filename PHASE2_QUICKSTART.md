# Quick Start: Implementing Actor Model Phase 2

This guide will help you quickly implement the next phase of the actor model.

---

## Prerequisites

✅ Current system is running (backend + frontend)  
✅ Database is set up and working  
✅ You can log in as admin and customer  

---

## Step 1: Run Database Migrations (5 minutes)

### 1.1 Backup Current Database (Recommended)
```bash
# Windows PowerShell
pg_dump -U postgres -d hotel_menu_system > backup_before_migration.sql
```

### 1.2 Run Migration v2 (Tables & Sessions)
```bash
psql -U postgres -d hotel_menu_system -f database/migration_v2.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
INSERT 0 5
```

### 1.3 Run Migration v3 (Actor Model)
```bash
psql -U postgres -d hotel_menu_system -f database/migration_v3_actor_model.sql
```

**Expected Output:**
```
ALTER TABLE
CREATE TABLE
... (multiple tables created)
NOTICE: Migration v3 (Actor Model) completed successfully!
```

### 1.4 Verify Migrations
```bash
# Check if new tables exist
psql -U postgres -d hotel_menu_system -c "\dt"

# Check user role constraint
psql -U postgres -d hotel_menu_system -c "\d users"
```

---

## Step 2: Create Test Users (2 minutes)

```sql
-- Connect to database
psql -U postgres -d hotel_menu_system

-- Create test users for each role
INSERT INTO users (email, password_hash, full_name, role) VALUES
('kitchen@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kitchen Staff', 'kitchen'),
('cashier@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Cashier', 'cashier'),
('waiter@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Waiter', 'staff'),
('manager@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manager', 'manager'),
('owner@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Owner', 'owner');

-- Verify users created
SELECT email, role FROM users;

-- Exit psql
\q
```

**Default Password for all test users:** `admin123` (change in production!)

---

## Step 3: Restart Backend (1 minute)

The backend needs to reload the updated constants.

```bash
# Stop current backend (Ctrl+C in the terminal)
# Then restart:
cd backend
npm run dev
```

**Verify:** Backend should start without errors and show updated role constants.

---

## Step 4: Test Role-Based Access (5 minutes)

### 4.1 Test Login with Different Roles

**Using Postman or curl:**

```bash
# Login as Kitchen Staff
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kitchen@hotel.com","password":"admin123"}'

# Response should include:
# { "token": "...", "user": { "role": "kitchen", ... } }
```

### 4.2 Test Role Restrictions

```bash
# Try to create menu as kitchen staff (should fail)
curl -X POST http://localhost:5000/api/menus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KITCHEN_TOKEN" \
  -d '{"name":"Test Menu"}'

# Expected: 403 Forbidden
```

---

## Step 5: Choose Your Next Implementation

Pick one of these to implement first:

### Option A: Kitchen Dashboard (Recommended First)
**Why:** Most impactful for restaurant operations  
**Time:** 1-2 days  
**Complexity:** Medium  

**Files to Create:**
```
frontend/src/pages/KitchenDashboard.jsx
frontend/src/components/Kitchen/OrderQueue.jsx
frontend/src/components/Kitchen/OrderCard.jsx
backend/controllers/kitchenController.js
backend/routes/kitchen.js
```

**Quick Template:**
```javascript
// frontend/src/pages/KitchenDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
    // TODO: Add real-time updates
  }, []);

  const fetchOrders = async () => {
    const response = await axios.get('/api/orders?status=pending,confirmed,preparing');
    setOrders(response.data);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
    fetchOrders();
  };

  return (
    <div className="kitchen-dashboard">
      <h1>Kitchen Display System</h1>
      <div className="order-queue">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <h3>Order #{order.id.slice(0, 8)}</h3>
            <p>Table: {order.table_number}</p>
            <p>Status: {order.status}</p>
            {/* Add order items, special instructions, etc. */}
            <button onClick={() => updateOrderStatus(order.id, 'preparing')}>
              Start Cooking
            </button>
            <button onClick={() => updateOrderStatus(order.id, 'ready')}>
              Mark Ready
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenDashboard;
```

### Option B: Guest Sessions (QR Code Ordering)
**Why:** Enables tourist-friendly ordering  
**Time:** 1-2 days  
**Complexity:** Medium  

**Files to Create:**
```
backend/controllers/guestController.js
backend/routes/guest.js
backend/utils/qrCodeGenerator.js
frontend/src/pages/GuestMenuPage.jsx
```

**Quick Template:**
```javascript
// backend/controllers/guestController.js
import { pool } from '../config/database.js';
import crypto from 'crypto';

export const createGuestSession = async (req, res) => {
  try {
    const { table_id } = req.body;
    
    // Generate unique session token
    const session_token = crypto.randomBytes(32).toString('hex');
    
    // Session expires in 2 hours
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    const result = await pool.query(
      'INSERT INTO guest_sessions (table_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [table_id, session_token, expires_at]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Option C: Cashier Dashboard (Payment Processing)
**Why:** Complete the order-to-payment flow  
**Time:** 2-3 days  
**Complexity:** High (requires payment gateway)  

**Files to Create:**
```
frontend/src/pages/CashierDashboard.jsx
frontend/src/components/Cashier/PaymentProcessor.jsx
backend/controllers/paymentController.js
backend/routes/payments.js
```

---

## Step 6: Update Frontend Routing (10 minutes)

Add routes for new dashboards:

```javascript
// frontend/src/App.jsx
import KitchenDashboard from './pages/KitchenDashboard';
import CashierDashboard from './pages/CashierDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

// Add to your routes
<Route 
  path="/kitchen" 
  element={
    <ProtectedRoute allowedRoles={['kitchen', 'manager', 'admin']}>
      <KitchenDashboard />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/cashier" 
  element={
    <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
      <CashierDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Step 7: Update Navigation (5 minutes)

Add role-based navigation:

```javascript
// frontend/src/components/Navigation.jsx
const Navigation = () => {
  const { user } = useAuth();

  return (
    <nav>
      {user?.role === 'kitchen' && (
        <Link to="/kitchen">Kitchen Display</Link>
      )}
      
      {user?.role === 'cashier' && (
        <Link to="/cashier">Cashier</Link>
      )}
      
      {user?.role === 'manager' && (
        <Link to="/manager">Manager Dashboard</Link>
      )}
      
      {/* ... other role-based links */}
    </nav>
  );
};
```

---

## Testing Your Implementation

### Test Checklist

- [ ] Database migrations ran successfully
- [ ] Test users created for all roles
- [ ] Backend restarted without errors
- [ ] Can log in with different roles
- [ ] Role-based access control works (403 for unauthorized)
- [ ] New dashboard is accessible
- [ ] Navigation shows role-specific links
- [ ] Can perform role-specific actions

### Manual Testing Flow

1. **Login as Kitchen Staff**
   - Email: `kitchen@hotel.com`
   - Password: `admin123`
   - Should see Kitchen Dashboard
   - Should NOT see Admin Panel

2. **Create Test Order (as Customer)**
   - Login as customer
   - Place an order
   - Verify it appears in Kitchen Dashboard

3. **Update Order Status (as Kitchen)**
   - Login as kitchen staff
   - Mark order as "preparing"
   - Mark order as "ready"
   - Verify status changes

---

## Troubleshooting

### Migration Errors

**Error:** `relation "branches" already exists`
- **Solution:** Migration already ran. Check with `\dt` in psql

**Error:** `constraint "users_role_check" already exists`
- **Solution:** Role constraint already updated. Safe to ignore.

### Login Errors

**Error:** `Invalid role`
- **Solution:** Backend needs restart to load new roles from constants.js

**Error:** `User not found`
- **Solution:** Run the INSERT statements to create test users

### Access Errors

**Error:** `403 Forbidden`
- **Expected:** This means RBAC is working correctly
- **Check:** Verify user has correct role for the endpoint

---

## Next Steps After Phase 2

Once you've implemented one or more Phase 2 features:

1. **Add Real-Time Updates**
   - Implement WebSockets for live order updates
   - Kitchen sees new orders instantly
   - Customers see status changes in real-time

2. **Implement Notifications**
   - Email/SMS when order is ready
   - Push notifications for staff
   - Alert system for managers

3. **Add Analytics**
   - Manager dashboard with metrics
   - Sales reports
   - Performance tracking

4. **Payment Integration**
   - Choose payment provider (Stripe/PayPal)
   - Implement payment flow
   - Generate digital receipts

---

## Resources

- **[Actor Model](ACTOR_MODEL.md)** - Full specifications
- **[Implementation Checklist](ACTOR_MODEL_IMPLEMENTATION_CHECKLIST.md)** - Track progress
- **[RBAC Reference](RBAC_REFERENCE.md)** - Access control guide
- **[Summary](ACTOR_MODEL_SUMMARY.md)** - Overview and decisions

---

## Getting Help

**Stuck?** Check these in order:
1. Error messages in terminal
2. Browser console for frontend errors
3. Database logs for SQL errors
4. RBAC Reference for access control issues
5. Implementation Checklist for what's needed

**Common Issues:**
- Backend not restarting → Kill process and restart
- 403 errors → Check user role and endpoint permissions
- Database errors → Verify migrations ran successfully
- Login fails → Check password hash and user exists

---

## Time Estimates

| Task | Time | Difficulty |
|------|------|------------|
| Run migrations | 5 min | Easy |
| Create test users | 2 min | Easy |
| Test role access | 5 min | Easy |
| Kitchen Dashboard | 1-2 days | Medium |
| Guest Sessions | 1-2 days | Medium |
| Cashier Dashboard | 2-3 days | High |
| Manager Dashboard | 2-3 days | Medium |
| Payment Integration | 3-5 days | High |

---

**Ready to start?** Begin with Step 1: Run Database Migrations!

**Questions?** Refer to the documentation files or review the implementation checklist.

---

**Last Updated:** January 23, 2026  
**Status:** Ready for Phase 2 Implementation
