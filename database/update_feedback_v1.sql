-- Migration to enhance feedback with AI sentiment and admin responses
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_response TEXT;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('positive', 'neutral', 'negative'));
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS sentiment_analyzed_at TIMESTAMP;
