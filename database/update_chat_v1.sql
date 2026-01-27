-- ============================================
-- MESSAGES TABLE FOR INTERNAL CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20), -- 'kitchen', 'staff', 'manager', 'admin', 'all'
    message TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'info', -- 'info', 'warning', 'urgent'
    table_number VARCHAR(10), -- Optional: link message to a table
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_role ON messages(recipient_role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
