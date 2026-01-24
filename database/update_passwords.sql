
-- Update passwords for all test users
UPDATE users 
SET password_hash = '$2a$10$ZK99Dg2hsqR6Ziw59zWpgu5wduMQ.ogwWp3eNocH/yx.ryP.8LM6i'
WHERE email IN (
    'kitchen@hotel.com', 
    'cashier@hotel.com', 
    'waiter@hotel.com', 
    'manager@hotel.com', 
    'owner@hotel.com',
    'admin@hotel.com'
);
