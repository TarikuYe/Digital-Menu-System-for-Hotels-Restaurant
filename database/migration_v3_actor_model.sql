-- Migration: Actor Model Implementation - Phase 2 & 3
-- Adds support for specialized roles, payments, branches, and management features
-- Run after migration_v2.sql

-- ============================================
-- 1. UPDATE USER ROLES
-- ============================================

-- Drop existing constraint and add new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'owner', 'manager', 'staff', 'kitchen', 'cashier', 'customer'));

-- Add branch assignment for multi-location support
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;

-- ============================================
-- 2. BRANCHES TABLE (Multi-location Support)
-- ============================================

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link existing tables to branches
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add foreign key constraint for users
ALTER TABLE users ADD CONSTRAINT fk_users_branch 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- ============================================
-- 3. PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile_wallet', 'digital', 'other')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'USD',
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response TEXT, -- JSON response from payment gateway
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    processed_by UUID REFERENCES users(id), -- Cashier who processed payment
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. RECEIPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    service_charge DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    receipt_data TEXT, -- JSON data for receipt details
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. STAFF SCHEDULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    role_assignment VARCHAR(50), -- 'waiter', 'chef', 'cashier', 'manager'
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'order_update', 'payment', 'feedback', 'system', 'promotion'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- 'order', 'payment', 'feedback'
    related_entity_id UUID,
    channel VARCHAR(20) CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. SYSTEM SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can customers see this setting?
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, setting_key)
);

-- ============================================
-- 8. MENU PERFORMANCE ANALYTICS (Materialized View)
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS menu_performance_analytics AS
SELECT 
    f.id as food_id,
    f.name as food_name,
    f.menu_id,
    m.name as menu_name,
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.subtotal) as total_revenue,
    AVG(fb.rating) as average_rating,
    COUNT(DISTINCT fb.id) as feedback_count,
    f.price as current_price,
    f.is_available,
    MAX(o.created_at) as last_ordered_at
FROM foods f
LEFT JOIN menus m ON f.menu_id = m.id
LEFT JOIN order_items oi ON f.id = oi.food_id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN feedback fb ON f.id = fb.food_id
GROUP BY f.id, f.name, f.menu_id, m.name, f.price, f.is_available;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_menu_performance_food_id ON menu_performance_analytics(food_id);
CREATE INDEX IF NOT EXISTS idx_menu_performance_total_revenue ON menu_performance_analytics(total_revenue DESC);

-- ============================================
-- 9. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_by ON payments(processed_by);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_shift_date ON staff_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

-- ============================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. ADD PAYMENT STATUS TO ORDERS
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) 
    DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded'));

-- ============================================
-- 12. SEED DATA
-- ============================================

-- Insert default branch (for existing data)
INSERT INTO branches (name, address, city, country, is_active) VALUES
('Main Branch', '123 Main Street', 'City Center', 'Country', TRUE)
ON CONFLICT DO NOTHING;

-- Insert common system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('tax_rate', '0.10', 'number', 'Tax rate (10%)', TRUE),
('service_charge', '0.05', 'number', 'Service charge (5%)', TRUE),
('currency', 'USD', 'string', 'Default currency', TRUE),
('timezone', 'UTC', 'string', 'Default timezone', FALSE),
('max_table_capacity', '10', 'number', 'Maximum table capacity', FALSE),
('order_timeout_minutes', '120', 'number', 'Order session timeout', FALSE),
('enable_guest_ordering', 'true', 'boolean', 'Allow guest ordering via QR', TRUE),
('enable_online_payment', 'true', 'boolean', 'Enable online payment', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. FUNCTIONS FOR ANALYTICS
-- ============================================

-- Function to refresh menu performance analytics
CREATE OR REPLACE FUNCTION refresh_menu_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW menu_performance_analytics;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily sales summary
CREATE OR REPLACE FUNCTION get_daily_sales_summary(target_date DATE)
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue DECIMAL,
    total_customers BIGINT,
    average_order_value DECIMAL,
    completed_orders BIGINT,
    cancelled_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(DISTINCT user_id)::BIGINT as total_customers,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(*) FILTER (WHERE status = 'served')::BIGINT as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders
    FROM orders
    WHERE DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE branches IS 'Restaurant branches for multi-location support';
COMMENT ON TABLE payments IS 'Payment transactions for orders';
COMMENT ON TABLE receipts IS 'Digital receipts for completed orders';
COMMENT ON TABLE staff_schedules IS 'Staff shift schedules and assignments';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE system_settings IS 'Configurable system settings per branch';

COMMENT ON COLUMN users.role IS 'User role: admin, owner, manager, staff, kitchen, cashier, customer';
COMMENT ON COLUMN payments.gateway_response IS 'JSON response from payment gateway for debugging';
COMMENT ON COLUMN receipts.receipt_data IS 'JSON data containing full receipt details';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration v3 (Actor Model) completed successfully!';
    RAISE NOTICE 'New tables created: branches, payments, receipts, staff_schedules, notifications, system_settings';
    RAISE NOTICE 'User roles updated to include: owner, manager, kitchen, cashier';
    RAISE NOTICE 'Analytics views and functions created';
END $$;
