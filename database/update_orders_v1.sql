-- Add assigned_to column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
