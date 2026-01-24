-- ============================================
-- KITCHEN & ORDER ENHANCEMENTS
-- ============================================

-- Add priority and estimated prep time to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER; -- minutes

-- Add stock alert support to foods
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_low_stock BOOLEAN DEFAULT FALSE;

-- Kitchen Hygiene & Safety Logs
CREATE TABLE IF NOT EXISTS kitchen_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    check_type VARCHAR(50) NOT NULL, -- 'hygiene', 'safety', 'incident'
    details TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitchen_logs_user_id ON kitchen_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_logs_check_type ON kitchen_logs(check_type);
