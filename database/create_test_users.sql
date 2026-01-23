-- Create test users for all roles
-- Password for all: admin123 (hashed with bcrypt)

INSERT INTO users (email, password_hash, full_name, role) VALUES
('kitchen@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Kitchen Staff', 'kitchen'),
('cashier@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Cashier', 'cashier'),
('waiter@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Waiter', 'staff'),
('manager@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manager', 'manager'),
('owner@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Owner', 'owner')
ON CONFLICT (email) DO NOTHING;

-- Verify users created
SELECT email, role, full_name FROM users ORDER BY role;
