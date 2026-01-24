-- Smart Digital Hotel and Restaurant Menu System
-- Database Schema for PostgreSQL
-- Database Name: hotel_menu_system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'en', 'es', 'fr', 'zh'
    name VARCHAR(100) NOT NULL, -- e.g., 'English', 'Spanish'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MENUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INGREDIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    allergen_type VARCHAR(50), -- e.g., 'nuts', 'dairy', 'gluten', 'seafood'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
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
CREATE TABLE IF NOT EXISTS food_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(food_id, ingredient_id)
);

-- ============================================
-- FOOD_TRANSLATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS food_translations (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
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
CREATE TABLE IF NOT EXISTS feedback (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_foods_menu_id ON foods(menu_id);
CREATE INDEX IF NOT EXISTS idx_foods_is_available ON foods(is_available);
CREATE INDEX IF NOT EXISTS idx_food_ingredients_food_id ON food_ingredients(food_id);
CREATE INDEX IF NOT EXISTS idx_food_ingredients_ingredient_id ON food_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_food_translations_food_id ON food_translations(food_id);
CREATE INDEX IF NOT EXISTS idx_food_translations_language_id ON food_translations(language_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food_id ON order_items(food_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_food_id ON feedback(food_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
