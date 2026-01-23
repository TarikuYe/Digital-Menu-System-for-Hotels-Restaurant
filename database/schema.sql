-- Smart Digital Hotel and Restaurant Menu System
-- Database Schema for PostgreSQL
-- Database Name: hotel_menu_system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LANGUAGES TABLE
-- ============================================
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'en', 'es', 'fr', 'zh'
    name VARCHAR(100) NOT NULL, -- e.g., 'English', 'Spanish'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MENUS TABLE
-- ============================================
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INGREDIENTS TABLE
-- ============================================
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    allergen_type VARCHAR(50), -- e.g., 'nuts', 'dairy', 'gluten', 'seafood'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOODS TABLE
-- ============================================
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 5), -- 0=None, 5=Very Hot
    preparation_time INTEGER, -- in minutes
    is_available BOOLEAN DEFAULT TRUE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    calories INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOOD_INGREDIENTS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE food_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(food_id, ingredient_id)
);

-- ============================================
-- FOOD_TRANSLATIONS TABLE
-- ============================================
CREATE TABLE food_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(food_id, language_id)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled')),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    sentiment_score DECIMAL(3, 2), -- -1.0 to 1.0 (optional, for AI analysis)
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_foods_menu_id ON foods(menu_id);
CREATE INDEX idx_foods_is_available ON foods(is_available);
CREATE INDEX idx_food_ingredients_food_id ON food_ingredients(food_id);
CREATE INDEX idx_food_ingredients_ingredient_id ON food_ingredients(ingredient_id);
CREATE INDEX idx_food_translations_food_id ON food_translations(food_id);
CREATE INDEX idx_food_translations_language_id ON food_translations(language_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_food_id ON order_items(food_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_food_id ON feedback(food_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_translations_updated_at BEFORE UPDATE ON food_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default languages
INSERT INTO languages (code, name, is_default) VALUES
('en', 'English', TRUE),
('es', 'Spanish', FALSE),
('fr', 'French', FALSE),
('zh', 'Chinese', FALSE),
('ar', 'Arabic', FALSE),
('de', 'German', FALSE);

-- Insert default admin user (password: admin123 - MUST be changed in production!)
-- To generate a proper password hash, run: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123',10).then(h=>console.log(h))"
-- Or use the setup script: node backend/scripts/setupAdmin.js
-- Default password hash for 'admin123' (temporary - change immediately):
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@hotel.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'admin');

-- Insert sample menu
INSERT INTO menus (name, description, is_active, display_order) VALUES
('Main Course', 'Our delicious main dishes', TRUE, 1),
('Appetizers', 'Start your meal right', TRUE, 2),
('Desserts', 'Sweet endings', TRUE, 3),
('Beverages', 'Refreshing drinks', TRUE, 4);

-- Insert sample ingredients
INSERT INTO ingredients (name, allergen_type) VALUES
('Peanuts', 'nuts'),
('Milk', 'dairy'),
('Wheat', 'gluten'),
('Shrimp', 'seafood'),
('Eggs', 'eggs'),
('Soy', 'soy'),
('Tomatoes', NULL),
('Onions', NULL),
('Garlic', NULL),
('Chili Peppers', NULL),
('Basil', NULL),
('Olive Oil', NULL);

-- Insert sample foods
INSERT INTO foods (menu_id, name, description, price, spice_level, preparation_time, is_vegetarian, is_vegan, is_gluten_free, calories) VALUES
(
    (SELECT id FROM menus WHERE name = 'Main Course' LIMIT 1),
    'Spicy Thai Curry',
    'Aromatic Thai curry with coconut milk and vegetables',
    18.99,
    4,
    25,
    TRUE,
    FALSE,
    TRUE,
    450
),
(
    (SELECT id FROM menus WHERE name = 'Main Course' LIMIT 1),
    'Grilled Salmon',
    'Fresh Atlantic salmon with lemon butter sauce',
    24.99,
    1,
    20,
    FALSE,
    FALSE,
    TRUE,
    380
),
(
    (SELECT id FROM menus WHERE name = 'Appetizers' LIMIT 1),
    'Caesar Salad',
    'Crisp romaine lettuce with Caesar dressing',
    12.99,
    0,
    10,
    FALSE,
    FALSE,
    FALSE,
    250
),
(
    (SELECT id FROM menus WHERE name = 'Desserts' LIMIT 1),
    'Chocolate Lava Cake',
    'Warm chocolate cake with molten center',
    8.99,
    0,
    15,
    TRUE,
    FALSE,
    FALSE,
    420
);

-- Link foods with ingredients
INSERT INTO food_ingredients (food_id, ingredient_id)
SELECT 
    f.id,
    i.id
FROM foods f, ingredients i
WHERE f.name = 'Spicy Thai Curry' AND i.name IN ('Chili Peppers', 'Coconut Milk', 'Basil', 'Garlic');

INSERT INTO food_ingredients (food_id, ingredient_id)
SELECT 
    f.id,
    i.id
FROM foods f, ingredients i
WHERE f.name = 'Grilled Salmon' AND i.name IN ('Shrimp', 'Olive Oil', 'Lemon');

INSERT INTO food_ingredients (food_id, ingredient_id)
SELECT 
    f.id,
    i.id
FROM foods f, ingredients i
WHERE f.name = 'Caesar Salad' AND i.name IN ('Milk', 'Eggs', 'Wheat', 'Garlic');

-- Insert food translations (sample)
INSERT INTO food_translations (food_id, language_id, name, description)
SELECT 
    f.id,
    l.id,
    'Curry Tailandés Picante',
    'Curry tailandés aromático con leche de coco y verduras'
FROM foods f, languages l
WHERE f.name = 'Spicy Thai Curry' AND l.code = 'es';

INSERT INTO food_translations (food_id, language_id, name, description)
SELECT 
    f.id,
    l.id,
    'Curry Thaï Épicé',
    'Curry thaï aromatique au lait de coco et légumes'
FROM foods f, languages l
WHERE f.name = 'Spicy Thai Curry' AND l.code = 'fr';

