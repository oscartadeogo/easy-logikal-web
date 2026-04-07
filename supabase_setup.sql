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

-- NOTA: Asegúrate de habilitar las políticas de seguridad (RLS) en Supabase 
-- o permitir acceso anónimo si el proyecto es público para pruebas.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (ejemplo para productos y blog)
CREATE POLICY "Public read for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read for posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read for marketing" ON marketing FOR SELECT USING (true);

-- Política de inserción para contactos y órdenes (público para que clientes envíen datos)
CREATE POLICY "Public insert for contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert for orders" ON orders FOR INSERT WITH CHECK (true);
