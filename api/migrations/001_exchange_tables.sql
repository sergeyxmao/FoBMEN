-- ============================================
-- FOHOW Exchange — Создание таблиц
-- Выполнено: 2025-02-18
-- Статус: ПРИМЕНЕНО В БД
-- НЕ ВЫПОЛНЯТЬ ПОВТОРНО
-- ============================================

-- 1. exchange_products (справочник продукции FOHOW)
CREATE TABLE IF NOT EXISTS exchange_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('supplements', 'cosmetics', 'food', 'devices', 'other')),
    description TEXT,
    image_url TEXT,
    retail_price NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. exchange_listings (объявления об обмене)
CREATE TABLE IF NOT EXISTS exchange_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES exchange_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'opened', 'used')),
    description TEXT,
    city VARCHAR(100),
    wanted_description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. exchange_offers (предложения обмена)
CREATE TABLE IF NOT EXISTS exchange_offers (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES exchange_listings(id) ON DELETE CASCADE,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. exchange_offer_items (позиции предложения — что предлагают в обмен)
CREATE TABLE IF NOT EXISTS exchange_offer_items (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES exchange_offers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES exchange_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'opened', 'used'))
);

-- 5. exchange_deals (сделки)
CREATE TABLE IF NOT EXISTS exchange_deals (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER NOT NULL REFERENCES exchange_offers(id),
    listing_id INTEGER NOT NULL REFERENCES exchange_listings(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'disputed', 'cancelled')),
    seller_confirmed BOOLEAN DEFAULT false,
    buyer_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 6. exchange_reviews (отзывы по сделкам)
CREATE TABLE IF NOT EXISTS exchange_reviews (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL REFERENCES exchange_deals(id),
    from_user_id INTEGER NOT NULL REFERENCES users(id),
    to_user_id INTEGER NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (deal_id, from_user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_listings_user ON exchange_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_product ON exchange_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON exchange_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON exchange_listings(city);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON exchange_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_from ON exchange_offers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_to ON exchange_offers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_deals_seller ON exchange_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer ON exchange_deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON exchange_reviews(to_user_id);

-- Тестовые данные — продукты FOHOW
INSERT INTO exchange_products (name, name_en, category, description, retail_price) VALUES
    ('Линчжи Феникс', 'Linchzhi Phoenix', 'supplements', 'Эликсир на основе линчжи', 4500.00),
    ('Сань Гао Дан', 'San Gao Dan', 'supplements', 'Капсулы для нормализации давления', 3200.00),
    ('Фохоу Крем для лица', 'FOHOW Face Cream', 'cosmetics', 'Увлажняющий крем с экстрактами', 2800.00),
    ('Чай Лювэй', 'Liuwei Tea', 'food', 'Оздоровительный чай', 1500.00),
    ('Кальций Хайцао Гай', 'Haizao Gai Calcium', 'supplements', 'Кальций на основе морских водорослей', 2100.00),
    ('Прибор ТяньШи', 'TianShi Device', 'devices', 'Массажный прибор', 15000.00),
    ('Зубная паста FOHOW', 'FOHOW Toothpaste', 'cosmetics', 'Зубная паста с экстрактами', 800.00),
    ('Шампунь FOHOW', 'FOHOW Shampoo', 'cosmetics', 'Шампунь с натуральными компонентами', 1200.00)
ON CONFLICT DO NOTHING;
