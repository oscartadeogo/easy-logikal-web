-- MIGRACIÓN PARA ESTADO DE PRODUCTO Y VARIANTES MEJORADAS
-- Easy Logikal Comercialización

-- 1. Agregar columna de estado si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='status') THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='shipping_info') THEN
        ALTER TABLE products ADD COLUMN shipping_info JSONB DEFAULT '{"free_shipping": false, "cost": 0}';
    END IF;
END $$;

-- 2. Asegurar que los productos actuales tengan estado 'active'
UPDATE products SET status = 'active' WHERE status IS NULL;

-- Nota: Las variantes en JSONB son flexibles, se manejarán por código.
