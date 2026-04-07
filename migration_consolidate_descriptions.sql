-- MIGRACIÓN PARA CONSOLIDAR CAMPOS DE DESCRIPCIÓN
-- Easy Logikal Comercialización

-- 1. Consolidar campos en la tabla de PRODUCTOS
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='long_description') THEN
        -- Combinar contenido si existe
        UPDATE products 
        SET description = COALESCE(description, '') || 
                         CASE WHEN description IS NOT NULL AND long_description IS NOT NULL AND long_description <> '' THEN E'\n\n' ELSE '' END || 
                         COALESCE(long_description, '')
        WHERE long_description IS NOT NULL AND long_description <> '';
        
        -- Eliminar la columna antigua
        ALTER TABLE products DROP COLUMN long_description;
    END IF;
END $$;

-- 2. Consolidar campos en la tabla de POSTS (Blog)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='summary') THEN
        -- Combinar contenido si existe
        UPDATE posts 
        SET content = COALESCE(summary, '') || 
                     CASE WHEN summary IS NOT NULL AND content IS NOT NULL AND content <> '' THEN E'\n\n' ELSE '' END || 
                     COALESCE(content, '')
        WHERE summary IS NOT NULL AND summary <> '';
        
        -- Eliminar la columna antigua
        ALTER TABLE posts DROP COLUMN summary;
    END IF;
END $$;
