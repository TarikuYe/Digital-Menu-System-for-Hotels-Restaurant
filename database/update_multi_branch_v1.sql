-- Add branch support to orders and tables
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Update existing tables/orders to the main branch
UPDATE restaurant_tables SET branch_id = (SELECT id FROM branches WHERE name = 'Main Branch' LIMIT 1) WHERE branch_id IS NULL;
UPDATE orders SET branch_id = (SELECT id FROM branches WHERE name = 'Main Branch' LIMIT 1) WHERE branch_id IS NULL;
