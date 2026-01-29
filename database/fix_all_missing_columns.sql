-- Consolidated Fix for Missing Columns
-- This script adds all missing columns that might have been skipped in previous migrations

-- ============================================
-- USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;

-- ============================================
-- FOODS TABLE
-- ============================================
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS available_from TIME;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS available_until TIME;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS seasonal_start DATE;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS seasonal_end DATE;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_low_stock BOOLEAN DEFAULT FALSE;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS avg_actual_prep_time INTEGER;

-- ============================================
-- ORDERS TABLE
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id UUID;

-- ============================================
-- ADD CONSTRAINTS (Safely)
-- ============================================

-- Users Status Check
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('online', 'offline', 'busy', 'away'));
    END IF;
END $$;

-- Orders Priority Check
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_priority_check') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Orders Payment Status Check
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check') THEN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded'));
    END IF;
END $$;
