/**
 * Utility function to determine the appropriate dashboard route based on user role
 * @param {Object} user - The user object containing role information
 * @returns {string} - The route path for the user's dashboard
 */
export const getRoleDashboard = (user) => {
    if (!user || !user.role) {
        return '/menu'; // Default for guests
    }

    const roleRoutes = {
        admin: '/admin',
        manager: '/manager',
        kitchen: '/kitchen',
        staff: '/waiter',
        cashier: '/cashier',
        customer: '/menu',
    };

    return roleRoutes[user.role] || '/menu';
};

/**
 * Check if a user has permission to access a specific route
 * @param {Object} user - The user object containing role information
 * @param {string} route - The route to check access for
 * @returns {boolean} - Whether the user can access the route
 */
export const canAccessRoute = (user, route) => {
    if (!user || !user.role) {
        // Guests can only access menu and guest entry
        return route === '/menu' || route.startsWith('/scan/');
    }

    const rolePermissions = {
        admin: ['/admin', '/manager', '/kitchen', '/waiter', '/cashier', '/menu', '/orders'],
        manager: ['/manager', '/kitchen', '/waiter', '/cashier', '/menu', '/orders'],
        kitchen: ['/kitchen', '/menu', '/orders'],
        staff: ['/waiter', '/menu', '/orders'],
        cashier: ['/cashier', '/menu', '/orders'],
        customer: ['/menu', '/orders'],
    };

    const allowedRoutes = rolePermissions[user.role] || ['/menu'];

    // Check if the route starts with any allowed route
    return allowedRoutes.some(allowedRoute => route.startsWith(allowedRoute));
};
