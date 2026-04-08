-- SUPABASE SQL - CORRECCIONES PARA EASY LOGIKAL
-- Ejecutar esto en el SQL Editor de Supabase para corregir la configuración

-- 1. ELIMINAR POLÍTICAS ANTIGUAS INCOMPLETAS
DROP POLICY IF EXISTS "Public read for products" ON products;
DROP POLICY IF EXISTS "Public insert for contacts" ON contacts;
DROP POLICY IF EXISTS "Public insert for orders" ON orders;

-- 2. POLÍTICAS MEJORADAS PARA PRODUCTS

-- ✅ LECTURA: Público solo ve productos ACTIVOS
CREATE POLICY "Public read active products" ON products 
    FOR SELECT 
    USING (status = 'active' OR auth.role() = 'authenticated');

-- ✅ LECTURA: Search de productos activos
CREATE POLICY "Public search products" ON products
    FOR SELECT
    USING (status = 'active');

-- ✅ ESCRITURA: Admin puede crear productos
CREATE POLICY "Admin insert products" ON products 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ✅ ACTUALIZACIÓN: Admin puede actualizar productos
CREATE POLICY "Admin update own products" ON products 
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ✅ ELIMINACIÓN: Admin puede cambiar status (soft delete)
CREATE POLICY "Admin soft delete products" ON products
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND status != 'deleted')
    WITH CHECK (auth.role() = 'authenticated');

-- 3. POLÍTICAS PARA POSTS (BLOG)

DROP POLICY IF EXISTS "Public read for posts" ON posts;

-- ✅ Lectura pública solo de posts publicados
CREATE POLICY "Public read published posts" ON posts
    FOR SELECT
    USING (status = 'published');

-- ✅ Admin puede crear/editar posts
CREATE POLICY "Admin manage posts" ON posts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update posts" ON posts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 4. POLÍTICAS PARA MARKETING

DROP POLICY IF EXISTS "Public read for marketing" ON marketing;

-- ✅ Lectura pública de marketing activo
CREATE POLICY "Public read active marketing" ON marketing
    FOR SELECT
    USING (is_active = true);

-- ✅ Admin puede gestionar marketing
CREATE POLICY "Admin manage marketing" ON marketing
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin update marketing" ON marketing
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. POLÍTICAS PARA CONTACTS

DROP POLICY IF EXISTS "Public insert for contacts" ON contacts;

-- ✅ Público puede crear contactos
CREATE POLICY "Public create contacts" ON contacts
    FOR INSERT
    WITH CHECK (true);

-- ✅ Admin puede ver todos los contactos
CREATE POLICY "Admin read contacts" ON contacts
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ✅ Admin puede actualizar estado de contactos
CREATE POLICY "Admin update contacts" ON contacts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. POLÍTICAS PARA ORDERS

DROP POLICY IF EXISTS "Public insert for orders" ON orders;

-- ✅ Público puede crear órdenes
CREATE POLICY "Public create orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- ✅ Público puede ver órdenes (acceso limitado!)
CREATE POLICY "Public read own orders" ON orders
    FOR SELECT
    USING (auth.role() = 'authenticated' OR customer_email = current_user_email());

-- ✅ Admin puede ver todas las órdenes
CREATE POLICY "Admin read all orders" ON orders
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ✅ Admin puede actualizar órdenes
CREATE POLICY "Admin update orders" ON orders
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 7. CREAR ÍNDICES PARA PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

CREATE INDEX IF NOT EXISTS idx_marketing_active ON marketing(is_active);

-- 8. VERIFICAR QUE HAY PRODUCTOS ACTIVOS EN LA BD

SELECT COUNT(*) as productos_activos FROM products WHERE status = 'active';
SELECT COUNT(*) as productos_totales FROM products;
SELECT COUNT(*) as productos_pausados FROM products WHERE status = 'paused';
SELECT COUNT(*) as productos_eliminados FROM products WHERE status = 'deleted';

-- 9. LISTAR PRIMEROS 5 PRODUCTOS ACTIVOS

SELECT id, name, price, category, status FROM products 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 5;

-- 10. VERIFICAR POLÍTICAS CREADAS

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('products', 'posts', 'contacts', 'orders', 'marketing')
ORDER BY tablename, policyname;
