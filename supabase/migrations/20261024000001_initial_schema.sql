-- ========================================================
-- MIGRATION 001: INITIAL SCHEMA FOR ESPETINHO COMANDAS
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ESTABLISHMENTS (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    phone VARCHAR(30),
    address TEXT,
    opening_hours VARCHAR(100) DEFAULT 'Terça a Domingo das 18h às 00h',
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES (Linked to Supabase auth.users)
CREATE TYPE user_role AS ENUM ('admin', 'garcom', 'cozinha', 'caixa');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'garcom',
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TYPE production_sector AS ENUM ('churrasqueira', 'cozinha', 'bar');

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    default_sector production_sector NOT NULL DEFAULT 'churrasqueira',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(establishment_id, slug)
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price_cents INT NOT NULL CHECK (price_cents >= 0),
    cost_price_cents INT DEFAULT 0 CHECK (cost_price_cents >= 0),
    sector production_sector NOT NULL DEFAULT 'churrasqueira',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    allow_notes BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCT ADDONS
CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);

-- 6. RESTAURANT TABLES
CREATE TYPE table_status AS ENUM ('livre', 'ocupada', 'reservada');

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    label VARCHAR(50) NOT NULL, -- e.g. "Mesa 01", "Banqueta 03"
    capacity INT DEFAULT 4 CHECK (capacity > 0),
    qr_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    status table_status NOT NULL DEFAULT 'livre',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(establishment_id, table_number)
);

-- 7. TABS (COMANDAS)
CREATE TYPE tab_status AS ENUM ('open', 'closing', 'paid', 'cancelled');

CREATE TABLE IF NOT EXISTS public.tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
    table_id UUID REFERENCES public.restaurant_tables(id) ON DELETE SET NULL,
    opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    customer_phone VARCHAR(30),
    notes TEXT,
    status tab_status NOT NULL DEFAULT 'open',
    total_cents INT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    discount_cents INT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    paid_cents INT NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL RULE: Prevent two open tabs on the exact same table
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_tab_per_table 
ON public.tabs (table_id) 
WHERE status = 'open' AND table_id IS NOT NULL;

-- 8. ORDERS (Rodadas de Pedidos)
CREATE TYPE order_origin AS ENUM ('waiter', 'table_qr', 'external_catalog');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeout', 'delivery');
CREATE TYPE order_status AS ENUM ('received', 'preparing', 'ready', 'delivered', 'cancelled');

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE RESTRICT,
    order_number BIGSERIAL,
    origin order_origin NOT NULL DEFAULT 'waiter',
    order_type order_type NOT NULL DEFAULT 'dine_in',
    status order_status NOT NULL DEFAULT 'received',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- garçom se lançado por ele
    customer_name VARCHAR(150),
    customer_phone VARCHAR(30),
    delivery_address TEXT,
    general_notes TEXT,
    total_cents INT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TAB_ORDERS (Join table linking Orders to Tabs)
CREATE TABLE IF NOT EXISTS public.tab_orders (
    tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tab_id, order_id)
);

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    -- Snapshot fields to prevent future price changes altering old records
    product_name VARCHAR(255) NOT NULL,
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    addons_snapshot JSONB DEFAULT '[]'::jsonb, -- array of {name, price_cents}
    addons_total_cents INT NOT NULL DEFAULT 0 CHECK (addons_total_cents >= 0),
    total_cents INT NOT NULL CHECK (total_cents >= 0),
    notes TEXT,
    sector production_sector NOT NULL DEFAULT 'churrasqueira',
    status order_status NOT NULL DEFAULT 'received',
    prepared_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. BILL SPLITS (Divisão de Conta)
CREATE TYPE split_mode AS ENUM ('equal', 'custom');
CREATE TYPE split_status AS ENUM ('in_progress', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.bill_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    mode split_mode NOT NULL DEFAULT 'equal',
    num_people INT NOT NULL CHECK (num_people BETWEEN 2 AND 10),
    total_cents INT NOT NULL CHECK (total_cents >= 0),
    status split_status NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. BILL SPLIT PARTICIPANTS
CREATE TYPE participant_payment_status AS ENUM ('pending', 'partial', 'paid');

CREATE TABLE IF NOT EXISTS public.bill_split_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    split_id UUID NOT NULL REFERENCES public.bill_splits(id) ON DELETE CASCADE,
    participant_index INT NOT NULL CHECK (participant_index BETWEEN 1 AND 10),
    name VARCHAR(100) NOT NULL, -- e.g. "Pessoa 1", "João"
    assigned_cents INT NOT NULL CHECK (assigned_cents >= 0),
    paid_cents INT NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
    status participant_payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (split_id, participant_index)
);

-- 13. PAYMENTS (Histórico e Quitação)
CREATE TYPE payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card');

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tab_id UUID NOT NULL REFERENCES public.tabs(id) ON DELETE RESTRICT,
    split_participant_id UUID REFERENCES public.bill_split_participants(id) ON DELETE SET NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    method payment_method NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PAYMENT ADJUSTMENTS (Estornos e Correções)
CREATE TABLE IF NOT EXISTS public.payment_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    authorized_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    amount_cents INT NOT NULL, -- pode ser negativo para estorno
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_products_establishment ON public.products(establishment_id, is_available);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_lookup ON public.restaurant_tables(establishment_id, status);
CREATE INDEX IF NOT EXISTS idx_tabs_open ON public.tabs(establishment_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_sector_status ON public.order_items(sector, status);
CREATE INDEX IF NOT EXISTS idx_payments_tab ON public.payments(tab_id);
