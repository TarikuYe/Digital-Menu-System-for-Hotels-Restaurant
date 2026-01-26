# Role-Based Access Control Implementation

## Overview
This document describes the role-based access control (RBAC) system implemented for the Digital Menu System. Each user role now has restricted access to only their designated dashboard and features.

## User Roles and Their Dashboards

| Role     | Dashboard Route | Description                                      |
|----------|----------------|--------------------------------------------------|
| Admin    | `/admin`       | Full system access, can view all dashboards     |
| Manager  | `/manager`     | Management dashboard with analytics and reports |
| Kitchen  | `/kitchen`     | Kitchen order management                         |
| Staff    | `/waiter`      | Waiter/table management                          |
| Cashier  | `/cashier`     | Payment and billing management                   |
| Customer | `/menu`        | Menu browsing and ordering                       |
| Guest    | `/menu`        | Menu browsing (limited access)                   |

## Implementation Details

### 1. Role Redirect Utility (`utils/roleRedirect.js`)

**Purpose**: Centralized logic for role-based routing decisions

**Functions**:
- `getRoleDashboard(user)`: Returns the appropriate dashboard route for a user's role
- `canAccessRoute(user, route)`: Validates if a user can access a specific route

**Example**:
```javascript
import { getRoleDashboard } from '../utils/roleRedirect.js';

const dashboard = getRoleDashboard(user);
// Returns: '/admin' for admin, '/manager' for manager, etc.
```

### 2. Login Page Redirection (`pages/LoginPage.jsx`)

**Changes**:
- After successful login/registration, users are redirected to their role-specific dashboard
- Already authenticated users are automatically redirected to their dashboard
- No more manual navigation to `/menu` for all users

**Flow**:
1. User logs in
2. System identifies user role
3. User is redirected to appropriate dashboard
4. If user tries to access login page while authenticated, they're redirected to their dashboard

### 3. Enhanced Private Route Protection (`App.jsx`)

**PrivateRoute Component**:
- Validates user authentication
- Checks role-based permissions
- Redirects unauthorized users to their own dashboard (not `/menu`)
- Prevents cross-role access

**RootRedirect Component**:
- Handles root route (`/`) navigation
- Authenticated users → their dashboard
- Guests → `/menu`

**Example**:
```javascript
// Admin trying to access /cashier
<PrivateRoute allowedRoles={['cashier', 'manager', 'admin']}>
  <CashierDashboard />
</PrivateRoute>
// ✅ Admin has access (included in allowedRoles)

// Kitchen staff trying to access /admin
<PrivateRoute requireAdmin={true}>
  <AdminDashboard />
</PrivateRoute>
// ❌ Redirected to /kitchen (their dashboard)
```

### 4. Navigation Menu Updates (`components/Common/Navbar.jsx`)

**Changes**:
- Added Manager dashboard link
- Role-based link visibility
- Each role only sees navigation items they have access to

**Visibility Rules**:
- Admin: Sees all links
- Manager: Sees Manager, Kitchen, Tables, Cashier, Menu, Orders
- Kitchen: Sees Kitchen, Menu, Orders
- Staff: Sees Tables, Menu, Orders
- Cashier: Sees Cashier, Menu, Orders
- Customer/Guest: Sees Menu, Orders (if authenticated)

## Access Control Matrix (Navigation & Access)

| Route      | Admin | Manager | Kitchen | Staff | Cashier | Customer |
|------------|-------|---------|---------|-------|---------|----------|
| `/admin`   | ✅    | ❌      | ❌      | ❌    | ❌      | ❌       |
| `/manager` | ❌    | ✅      | ❌      | ❌    | ❌      | ❌       |
| `/kitchen` | ❌    | ❌      | ✅      | ❌    | ❌      | ❌       |
| `/waiter`  | ❌    | ❌      | ❌      | ✅    | ❌      | ❌       |
| `/cashier` | ❌    | ❌      | ❌      | ❌    | ✅      | ❌       |
| `/menu`    | ❌    | ❌      | ❌      | ❌    | ❌      | ✅       |
| `/orders`  | ❌    | ❌      | ❌      | ❌    | ❌      | ✅       |

*Note: While Admin/Manager technically have permission to access other routes (via direct URL), the navigation menu strictly hides links to dashboards that are not their primary workspace to reduce clutter.*

## Security Features

### 1. Automatic Redirection
- Users cannot manually navigate to unauthorized routes
- Attempting to access restricted routes redirects to user's dashboard
- No error pages shown, seamless UX

### 2. Role Hierarchy
- Admin has access to all dashboards
- Manager has access to operational dashboards (Kitchen, Waiter, Cashier)
- Other roles have access only to their specific dashboard

### 3. Session Persistence
- User role is stored in localStorage
- On page refresh, users remain on their dashboard
- Token validation ensures session integrity

## Testing the Implementation

### Test Scenarios

1. **Admin Login**
   - Login with: `admin@hotel.com`
   - Expected: Redirect to `/admin`
   - Can navigate to: All dashboards

2. **Manager Login**
   - Login with: `manager@hotel.com`
   - Expected: Redirect to `/manager`
   - Can navigate to: Manager, Kitchen, Waiter, Cashier
   - Cannot access: Admin dashboard

3. **Kitchen Login**
   - Login with: `kitchen@hotel.com`
   - Expected: Redirect to `/kitchen`
   - Can navigate to: Kitchen, Menu, Orders
   - Cannot access: Admin, Manager, Waiter, Cashier

4. **Waiter Login**
   - Login with: `waiter@hotel.com`
   - Expected: Redirect to `/waiter`
   - Can navigate to: Waiter, Menu, Orders
   - Cannot access: Admin, Manager, Kitchen, Cashier

5. **Cashier Login**
   - Login with: `cashier@hotel.com`
   - Expected: Redirect to `/cashier`
   - Can navigate to: Cashier, Menu, Orders
   - Cannot access: Admin, Manager, Kitchen, Waiter

### Manual Testing Steps

1. **Test Login Redirection**:
   ```
   1. Open browser to http://localhost:5173/login
   2. Login with different role credentials
   3. Verify redirect to correct dashboard
   ```

2. **Test Unauthorized Access**:
   ```
   1. Login as Kitchen staff
   2. Try to navigate to /admin
   3. Verify redirect to /kitchen
   ```

3. **Test Navigation Menu**:
   ```
   1. Login with different roles
   2. Verify only authorized links are visible
   3. Click on visible links to ensure access
   ```

4. **Test Already Authenticated**:
   ```
   1. Login as any role
   2. Try to navigate to /login
   3. Verify redirect to dashboard
   ```

## Files Modified

1. **Created**:
   - `frontend/src/utils/roleRedirect.js` - Role routing utilities

2. **Modified**:
   - `frontend/src/pages/LoginPage.jsx` - Role-based login redirection
   - `frontend/src/App.jsx` - Enhanced PrivateRoute and RootRedirect
   - `frontend/src/components/Common/Navbar.jsx` - Manager link and role checks

## Future Enhancements

1. **Granular Permissions**: Add feature-level permissions within dashboards
2. **Role Management UI**: Allow admins to change user roles
3. **Audit Logging**: Track unauthorized access attempts
4. **Multi-role Support**: Allow users to have multiple roles
5. **Dynamic Routes**: Load routes based on backend role configuration

## Troubleshooting

### Issue: User redirected to wrong dashboard
**Solution**: Check user role in localStorage and verify `getRoleDashboard()` mapping

### Issue: Navigation links not showing
**Solution**: Verify role checks in Navbar component match user's role

### Issue: Infinite redirect loop
**Solution**: Ensure RootRedirect and PrivateRoute don't conflict, check user authentication state

### Issue: Can access unauthorized routes
**Solution**: Verify PrivateRoute is wrapping the route and allowedRoles array is correct

## Conclusion

The role-based access control system ensures that each user type (admin, manager, kitchen, waiter, cashier, customer) can only access their designated areas of the application. This improves security, user experience, and system organization.
