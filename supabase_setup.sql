-- CONFIGURACIÓN DE BASE DE DATOS PARA EASY LOGIKAL COMERCIALIZACIÓN
-- Ejecuta este SQL en el Editor SQL de tu panel de Supabase

-- 1. Tabla de PRODUCTOS (con campos para catálogo pro)
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) DEFAULT 0.00,
    category TEXT DEFAULT 'general',
    brand TEXT DEFAULT 'Premium',
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 0,
    image TEXT, -- URL de imagen principal
    gallery TEXT[], -- Array de URLs de imágenes secundarias
    variants JSONB DEFAULT '[]', -- Variantes mejoradas: [{color: 'rojo', images: ['url1', 'url2'], price: 100, stock: 10}]
    badge TEXT, -- 'Nuevo', 'Oferta', 'Más Vendido'
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'deleted'
    shipping_info JSONB DEFAULT '{"free_shipping": false, "cost": 0}' -- Información de envío
);

-- 2. Tabla de ENTRADAS DE BLOG (CMS)
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Soporta HTML
    image TEXT, -- URL imagen destacada
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'published', -- 'published' o 'draft'
    author TEXT DEFAULT 'Admin Logikal'
);

-- 3. Tabla de CONTACTOS (Leads)
CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'new' -- 'new', 'read', 'replied'
);

-- 4. Tabla de PEDIDOS / COTIZACIONES
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL, -- Lista de productos comprados
    total DECIMAL(12,2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered'
    payment_method TEXT DEFAULT 'card'
);

-- 5. Tabla de MARKETING (Banners y Promociones)
CREATE TABLE IF NOT EXISTS marketing (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    subtitle TEXT,
    image TEXT,
    link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    type TEXT DEFAULT 'banner' -- 'banner', 'coupon', 'popup'
);

-- HABILITAR ROW LEVEL SECURITY (RLS) - LAS TABLAS REQUIEREN POLÍTICAS EXPLÍCITAS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;

-- 1. ELIMINAR POLÍTICAS ANTIGUAS INCOMPLETAS
DROP POLICY IF EXISTS "Public read for products" ON products;
DROP POLICY IF EXISTS "Public read for posts" ON posts;
DROP POLICY IF EXISTS "Public read for marketing" ON marketing;
DROP POLICY IF EXISTS "Public insert for contacts" ON contacts;
DROP POLICY IF EXISTS "Public insert for orders" ON orders;

-- 2. POLÍTICAS MEJORADAS PARA PRODUCTS

-- ✅ LECTURA: Público puede ver TODOS los productos excepto eliminados
CREATE POLICY "Public read products" ON products 
    FOR SELECT 
    USING (status IS NULL OR status != 'deleted');

-- ✅ ESCRITURA: Admin puede crear productos
CREATE POLICY "Admin insert products" ON products 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ✅ ACTUALIZACIÓN: Admin puede actualizar productos
CREATE POLICY "Admin update products" ON products 
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ✅ ELIMINACIÓN: Admin puede cambiar status (soft delete)
CREATE POLICY "Admin update product status" ON products
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND status != 'deleted')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. POLÍTICAS PARA POSTS (BLOG)

-- ✅ Lectura pública a todos los posts
CREATE POLICY "Public read posts" ON posts
    FOR SELECT
    USING (status IS NULL OR status != 'draft');

-- ✅ Admin puede crear/editar posts
CREATE POLICY "Admin insert posts" ON posts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update posts" ON posts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 4. POLÍTICAS PARA MARKETING

-- ✅ Lectura pública a marketing
CREATE POLICY "Public read marketing" ON marketing
    FOR SELECT
    USING (true);

-- ✅ Admin puede gestionar marketing
CREATE POLICY "Admin insert marketing" ON marketing
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update marketing" ON marketing
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. POLÍTICAS PARA CONTACTS

-- ✅ Público puede crear contactos
CREATE POLICY "Public create contacts" ON contacts
    FOR INSERT
    WITH CHECK (true);

-- 6. POLÍTICAS PARA ORDERS

-- ✅ Público puede crear órdenes
CREATE POLICY "Public create orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- ✅ Admin puede ver todas las órdenes
CREATE POLICY "Admin read orders" ON orders
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ✅ Admin puede actualizar órdenes
CREATE POLICY "Admin update orders" ON orders
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.r ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
