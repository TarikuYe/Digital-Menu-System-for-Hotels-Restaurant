-- Migration: Upgrade to Smart Digital Menu v2.0
-- Adds support for Tables, Guest Sessions, and Order Tracking

-- 1. Tables Management
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(10) UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'dirty', 'reserved')),
    qr_code_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Guest Sessions (For ordering without login)
CREATE TABLE IF NOT EXISTS guest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    guest_name VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Detailed Order Logs (For Prep Time Analytics)
CREATE TABLE IF NOT EXISTS order_status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Food Badges (Social Proof)
CREATE TABLE IF NOT EXISTS food_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'tourist_favorite', 'chef_choice', 'seasonal', 'trending'
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add table_id to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES restaurant_tables(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_session_id UUID REFERENCES guest_sessions(id);

-- Add Preparation Time Tracking
ALTER TABLE foods ADD COLUMN IF NOT EXISTS avg_actual_prep_time INTEGER; -- Updated by background job

-- Seed initial tables
INSERT INTO restaurant_tables (table_number, qr_code_token) VALUES 
('1', 'table_1_tkn_2024'),
('2', 'table_2_tkn_2024'),
('3', 'table_3_tkn_2024'),
('4', 'table_4_tkn_2024'),
('5', 'table_5_tkn_2024')
ON CONFLICT DO NOTHING;
