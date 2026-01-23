# Role-Based Access Control (RBAC) Reference Guide

## Quick Reference for Developers

This guide provides implementation details for role-based access control across the Digital Menu System.

---

## Available Roles

```javascript
// backend/utils/constants.js
export const USER_ROLES = {
  ADMIN: 'admin',           // Full system access
  OWNER: 'owner',           // Business analytics and multi-branch
  MANAGER: 'manager',       // Operations management
  STAFF: 'staff',           // General service staff (waiters)
  KITCHEN: 'kitchen',       // Kitchen operations
  CASHIER: 'cashier',       // Payment processing
  CUSTOMER: 'customer',     // End users
};
```

---

## Role Hierarchy

```
ADMIN (Highest Authority)
  ├── OWNER (Strategic)
  │   └── MANAGER (Operational)
  │       ├── STAFF (Service)
  │       ├── KITCHEN (Production)
  │       └── CASHIER (Financial)
  └── CUSTOMER (End User)
```

---

## Access Control Matrix

### API Endpoints Access

| Endpoint | Customer | Staff | Kitchen | Cashier | Manager | Admin | Owner |
|----------|----------|-------|---------|---------|---------|-------|-------|
| **Authentication** |
| POST /api/auth/register | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/auth/login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/auth/me | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Menus** |
| GET /api/menus | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/menus/:id | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/menus | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PUT /api/menus/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| DELETE /api/menus/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Foods** |
| GET /api/foods | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/foods/:id | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/foods | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PUT /api/foods/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PATCH /api/foods/:id/availability | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| DELETE /api/foods/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Orders** |
| POST /api/orders | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| GET /api/orders (own) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /api/orders (all) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /api/orders/:id | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /api/orders/:id/status | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| DELETE /api/orders/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Payments** |
| POST /api/payments | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| GET /api/payments | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /api/payments/:id/refund | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Receipts** |
| GET /api/receipts/:id | 🔒 | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| POST /api/receipts | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Feedback** |
| POST /api/feedback | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /api/feedback (own) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GET /api/feedback (all) | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| PUT /api/feedback/:id/visibility | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Tables** |
| GET /api/tables | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| PUT /api/tables/:id/status | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| POST /api/tables | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Analytics** |
| GET /api/analytics/sales | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| GET /api/analytics/menu-performance | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| GET /api/analytics/staff-performance | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Users** |
| GET /api/users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| POST /api/users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PUT /api/users/:id | 🔒 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| DELETE /api/users/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Branches** |
| GET /api/branches | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| POST /api/branches | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| PUT /api/branches/:id | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

**Legend:**
- ✅ Full Access
- ❌ No Access
- 🔒 Own Resources Only (requires ownership check)

---

## Implementation Examples

### 1. Basic Role Check (Middleware)

```javascript
// backend/middleware/auth.js

// Existing authenticate middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Existing authorize middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
```

### 2. Route Protection Examples

```javascript
// backend/routes/foods.js
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

// Public access - anyone can view
router.get('/', getFoods);
router.get('/:id', getFoodById);

// Admin only - menu management
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), createFood);
router.put('/:id', authenticate, authorize(USER_ROLES.ADMIN), updateFood);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteFood);

// Kitchen can update availability
router.patch('/:id/availability', 
  authenticate, 
  authorize(USER_ROLES.KITCHEN, USER_ROLES.MANAGER, USER_ROLES.ADMIN), 
  updateFoodAvailability
);
```

```javascript
// backend/routes/orders.js
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

// Customers can create orders
router.post('/', authenticate, createOrder);

// Customers can view their own orders (handled in controller)
router.get('/', authenticate, getOrders);

// Staff can update order status
router.put('/:id/status', 
  authenticate, 
  authorize(USER_ROLES.STAFF, USER_ROLES.KITCHEN, USER_ROLES.CASHIER, USER_ROLES.MANAGER, USER_ROLES.ADMIN), 
  updateOrderStatus
);
```

```javascript
// backend/routes/payments.js
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

// Only cashier, manager, and admin can process payments
router.post('/', 
  authenticate, 
  authorize(USER_ROLES.CASHIER, USER_ROLES.MANAGER, USER_ROLES.ADMIN), 
  processPayment
);

// Only cashier, manager, and admin can issue refunds
router.post('/:id/refund', 
  authenticate, 
  authorize(USER_ROLES.CASHIER, USER_ROLES.MANAGER, USER_ROLES.ADMIN), 
  processRefund
);
```

### 3. Controller-Level Access Control

```javascript
// backend/controllers/orderController.js
import { USER_ROLES } from '../utils/constants.js';

export const getOrders = async (req, res) => {
  try {
    let query = 'SELECT * FROM orders';
    let params = [];

    // Customers can only see their own orders
    if (req.user.role === USER_ROLES.CUSTOMER) {
      query += ' WHERE user_id = $1';
      params = [req.user.userId];
    }
    // Staff, kitchen, cashier can see all orders
    // Manager, admin, owner can see all orders

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kitchen can only set specific statuses
    if (req.user.role === USER_ROLES.KITCHEN) {
      const allowedStatuses = ['preparing', 'ready'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ 
          error: 'Kitchen staff can only set status to preparing or ready' 
        });
      }
    }

    // Cashier can only mark as served/completed
    if (req.user.role === USER_ROLES.CASHIER) {
      const allowedStatuses = ['served'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ 
          error: 'Cashier can only mark orders as served' 
        });
      }
    }

    // Update order status
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    // Log status change
    await pool.query(
      'INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
      [id, result.rows[0].status, status, req.user.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 4. Frontend Route Protection

```javascript
// frontend/src/App.jsx
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Route Configuration
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Customer Routes */}
      <Route 
        path="/my-orders" 
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyOrdersPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Kitchen Routes */}
      <Route 
        path="/kitchen" 
        element={
          <ProtectedRoute allowedRoles={['kitchen', 'manager', 'admin']}>
            <KitchenDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Cashier Routes */}
      <Route 
        path="/cashier" 
        element={
          <ProtectedRoute allowedRoles={['cashier', 'manager', 'admin']}>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Manager Routes */}
      <Route 
        path="/manager" 
        element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Owner Routes */}
      <Route 
        path="/owner" 
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### 5. Conditional UI Rendering

```javascript
// frontend/src/components/Navigation.jsx
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user } = useAuth();

  return (
    <nav>
      <ul>
        {/* Everyone can see menu */}
        <li><Link to="/menu">Menu</Link></li>
        
        {/* Customer-specific */}
        {user?.role === 'customer' && (
          <>
            <li><Link to="/my-orders">My Orders</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
          </>
        )}
        
        {/* Kitchen-specific */}
        {user?.role === 'kitchen' && (
          <li><Link to="/kitchen">Kitchen Display</Link></li>
        )}
        
        {/* Cashier-specific */}
        {user?.role === 'cashier' && (
          <li><Link to="/cashier">Cashier</Link></li>
        )}
        
        {/* Staff-specific */}
        {user?.role === 'staff' && (
          <>
            <li><Link to="/tables">Tables</Link></li>
            <li><Link to="/orders">Orders</Link></li>
          </>
        )}
        
        {/* Manager-specific */}
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <>
            <li><Link to="/manager">Dashboard</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
          </>
        )}
        
        {/* Admin-specific */}
        {user?.role === 'admin' && (
          <>
            <li><Link to="/admin">Admin Panel</Link></li>
            <li><Link to="/users">User Management</Link></li>
          </>
        )}
        
        {/* Owner-specific */}
        {user?.role === 'owner' && (
          <>
            <li><Link to="/owner">Business Overview</Link></li>
            <li><Link to="/branches">Branches</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};
```

---

## Role-Specific Workflows

### Customer Workflow
1. Scan QR code or visit menu
2. Browse menu (multilingual)
3. Add items to cart
4. Place order
5. Track order status
6. Receive notification when ready
7. Pay (cash or digital)
8. Provide feedback

### Kitchen Workflow
1. Log in to Kitchen Display System
2. View incoming orders (queue)
3. Accept order → Status: Confirmed
4. Start cooking → Status: Preparing
5. Complete dish → Status: Ready
6. Notify waiter (automatic)

### Waiter Workflow
1. Log in to Waiter Dashboard
2. View assigned tables
3. Assist customer with ordering
4. Confirm order details
5. Receive notification when food ready
6. Serve food → Status: Served
7. Direct customer to cashier

### Cashier Workflow
1. Log in to Cashier Dashboard
2. View orders ready for payment
3. Process payment (cash/card)
4. Generate receipt
5. Mark order as completed
6. Handle refunds if needed

### Manager Workflow
1. Log in to Manager Dashboard
2. Monitor real-time operations
3. View staff performance
4. Check sales reports
5. Review customer feedback
6. Handle escalations
7. Adjust operations as needed

### Admin Workflow
1. Log in to Admin Panel
2. Manage menus and food items
3. Manage users and roles
4. Configure system settings
5. Generate QR codes
6. View system logs
7. Backup data

### Owner Workflow
1. Log in to Owner Dashboard
2. View business analytics
3. Compare branch performance
4. Review financial reports
5. Make strategic decisions
6. Set business goals

---

## Database-Level Access Control

### Row-Level Security (Future Enhancement)

```sql
-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see their own orders
CREATE POLICY customer_orders_policy ON orders
    FOR SELECT
    TO customer_role
    USING (user_id = current_user_id());

-- Policy: Staff can see all orders
CREATE POLICY staff_orders_policy ON orders
    FOR ALL
    TO staff_role, kitchen_role, cashier_role, manager_role, admin_role
    USING (true);
```

---

## Security Best Practices

### 1. Token Management
- ✅ Use JWT with expiration
- ✅ Store tokens securely (httpOnly cookies or localStorage)
- ✅ Refresh tokens before expiration
- ✅ Invalidate tokens on logout

### 2. Password Security
- ✅ Hash passwords with bcrypt (salt rounds: 10+)
- ✅ Enforce strong password policies
- ✅ Never log or expose passwords
- ✅ Use HTTPS in production

### 3. Input Validation
- ✅ Validate all user inputs
- ✅ Use parameterized queries (prevent SQL injection)
- ✅ Sanitize data before storage
- ✅ Validate role assignments

### 4. Error Handling
- ❌ Don't expose sensitive error details
- ✅ Log errors server-side
- ✅ Return generic error messages to clients
- ✅ Monitor failed authentication attempts

### 5. Audit Logging
- ✅ Log all role changes
- ✅ Log sensitive operations (payments, refunds)
- ✅ Track order status changes
- ✅ Monitor admin actions

---

## Testing RBAC

### Test Cases

```javascript
// Test: Customer cannot access admin endpoints
describe('RBAC - Customer Access', () => {
  it('should deny customer access to admin endpoints', async () => {
    const customerToken = await loginAs('customer');
    const response = await request(app)
      .post('/api/foods')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Test Food' });
    
    expect(response.status).toBe(403);
  });
});

// Test: Kitchen can update food availability
describe('RBAC - Kitchen Access', () => {
  it('should allow kitchen to update food availability', async () => {
    const kitchenToken = await loginAs('kitchen');
    const response = await request(app)
      .patch('/api/foods/123/availability')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ is_available: false });
    
    expect(response.status).toBe(200);
  });
});

// Test: Cashier can process payments
describe('RBAC - Cashier Access', () => {
  it('should allow cashier to process payments', async () => {
    const cashierToken = await loginAs('cashier');
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ order_id: '123', amount: 50.00, method: 'cash' });
    
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue:** User gets 403 Forbidden despite having correct role
- **Solution:** Check if role is correctly stored in JWT token
- **Solution:** Verify middleware order (authenticate before authorize)

**Issue:** Role changes don't take effect
- **Solution:** User needs to log out and log back in
- **Solution:** Implement token refresh mechanism

**Issue:** Customer can see other customers' orders
- **Solution:** Add ownership check in controller
- **Solution:** Filter queries by user_id for customers

---

## Quick Reference Commands

```bash
# Check user roles in database
psql -U postgres -d hotel_menu_system -c "SELECT email, role FROM users;"

# Update user role
psql -U postgres -d hotel_menu_system -c "UPDATE users SET role = 'manager' WHERE email = 'user@example.com';"

# Count users by role
psql -U postgres -d hotel_menu_system -c "SELECT role, COUNT(*) FROM users GROUP BY role;"
```

---

**Last Updated:** January 23, 2026  
**Maintained By:** Development Team
