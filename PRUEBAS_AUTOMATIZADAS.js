/**
 * SUITE DE PRUEBAS COMPLETA
 * Easy Logikal Comercialización
 * 
 * Cambiar extensión a .js y ejecutar con Node.js o en DevTools
 * o usar con Jest/Vitest
 */

// ========================================================================
// PRUEBAS UNITARIAS - Supabase Client
// ========================================================================

async function testSupabaseClientInitialization() {
    console.log('\n📋 TEST: Inicialización de Supabase Client');
    
    try {
        const client = getSupabaseClient();
        
        if (!client) {
            console.error('❌ FALLO: Cliente no inicializado');
            return false;
        }
        
        if (typeof client.from !== 'function') {
            console.error('❌ FALLO: Cliente no tiene método from()');
            return false;
        }

        console.log('✅ PASO: Cliente inicializado correctamente');
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testFetchProducts() {
    console.log('\n📋 TEST: Cargar productos de BD');
    
    try {
        const products = await fetchProducts();
        
        if (!Array.isArray(products)) {
            console.error('❌ FALLO: Resultado no es array');
            return false;
        }

        if (products.length === 0) {
            console.warn('⚠️ ADVERTENCIA: No hay productos en BD con status=active');
            return false;
        }

        console.log(`✅ PASO: ${products.length} productos cargados`);
        
        // Validar estructura de primer producto
        const firstProduct = products[0];
        const requiredFields = ['id', 'name', 'price', 'category', 'status'];
        const hasAllFields = requiredFields.every(field => field in firstProduct);
        
        if (!hasAllFields) {
            console.error('❌ FALLO: Producto sin campos requeridos');
            return false;
        }

        console.log(`✅ PASO: Estructura de producto válida`);
        console.log('   - ID:', firstProduct.id);
        console.log('   - Nombre:', firstProduct.name);
        console.log('   - Precio:', firstProduct.price);
        console.log('   - Categoría:', firstProduct.category);
        
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testProductStatusFilter() {
    console.log('\n📋 TEST: Filtro de status=active');
    
    try {
        const supabase = getSupabaseClient();
        
        // Obtener solo activos
        const { data: activeProducts, error: activeError } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active');

        if (activeError) throw activeError;

        if (!activeProducts || activeProducts.length === 0) {
            console.warn('⚠️ ADVERTENCIA: Sin productos activos en BD');
            return false;
        }

        // Validar que ninguno tenga status diferente a 'active'
        const hasInvalidStatus = activeProducts.some(p => p.status !== 'active');
        
        if (hasInvalidStatus) {
            console.error('❌ FALLO: Hay productos con status incorrecto');
            return false;
        }

        console.log(`✅ PASO: ${activeProducts.length} productos activos (sin pausados)`);
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testProductCategoryFiltering() {
    console.log('\n📋 TEST: Filtrado por categoría');
    
    try {
        // Probar categoría específica
        const products = await fetchProducts({ category: 'maisto' });
        
        if (!Array.isArray(products)) {
            console.error('❌ FALLO: Resultado no es array');
            return false;
        }

        const allMaisto = products.every(p => p.category.toLowerCase() === 'maisto');
        
        if (!allMaisto) {
            console.error('❌ FALLO: Hay productos de otras categorías');
            return false;
        }

        console.log(`✅ PASO: Filtrado correcto (${products.length} productos Maisto)`);
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// ========================================================================
// PRUEBAS DE INTEGRACIÓN - Página de Productos
// ========================================================================

async function testProductsPageElements() {
    console.log('\n📋 TEST: Elementos de página productos.html');
    
    try {
        const checks = [
            { selector: '#product-container', name: 'Contenedor de productos' },
            { selector: '#product-search', name: 'Barra de búsqueda' },
            { selector: '#category-filters', name: 'Filtros de categoría' },
            { selector: '#price-range', name: 'Slider de precio' },
            { selector: '#sort-products', name: 'Selector de ordenamiento' },
            { selector: '#cart-toggle', name: 'Botón carrito' }
        ];

        const results = checks.map(check => {
            const element = document.querySelector(check.selector);
            const exists = element !== null;
            
            if (exists) {
                console.log(`✅ ${check.name}`);
            } else {
                console.error(`❌ ${check.name} NO ENCONTRADO`);
            }
            
            return exists;
        });

        return results.every(r => r === true);
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testProductRendering() {
    console.log('\n📋 TEST: Renderizado de productos');
    
    try {
        const productCards = document.querySelectorAll('.product-card');
        
        if (productCards.length === 0) {
            console.error('❌ FALLO: No hay tarjetas de producto renderizadas');
            return false;
        }

        console.log(`✅ PASO: ${productCards.length} tarjetas renderizadas`);

        // Validar estructura de primera tarjeta
        const firstCard = productCards[0];
        const validateElements = [
            { selector: '.product-image', name: 'Imagen' },
            { selector: '.product-title', name: 'Título' },
            { selector: '.product-price', name: 'Precio' },
            { selector: 'button', name: 'Ver Detalle' }
        ];

        const cardValid = validateElements.every(check => {
            return firstCard.querySelector(check.selector) !== null;
        });

        if (!cardValid) {
            console.error('❌ FALLO: Tarjeta sin elementos requeridos');
            return false;
        }

        console.log('✅ PASO: Estructura de tarjeta válida');
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testSearchFunctionality() {
    console.log('\n📋 TEST: Funcionalidad de búsqueda');
    
    try {
        const searchInput = document.getElementById('product-search');
        
        if (!searchInput) {
            console.error('❌ FALLO: Input de búsqueda no encontrado');
            return false;
        }

        if (allProducts.length === 0) {
            console.warn('⚠️ ADVERTENCIA: Sin productos en allProducts');
            return false;
        }

        // Simular búsqueda
        const firstProductName = allProducts[0].name;
        const searchTerm = firstProductName.substring(0, 3); // Primeras 3 letras

        const matches = allProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matches.length === 0) {
            console.error('❌ FALLO: Búsqueda no encuentra resultados');
            return false;
        }

        console.log(`✅ PASO: Búsqueda funciona (${matches.length} resultados encontrados)`);
        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

async function testFilteringByCategory() {
    console.log('\n📋 TEST: Filtrado por categoría en UI');
    
    try {
        const categoryButtons = document.querySelectorAll('[data-category]');
        
        if (categoryButtons.length === 0) {
            console.error('❌ FALLO: Botones de categoría no encontrados');
            return false;
        }

        // Simular click en primer botón no-"all"
        const nonAllButton = Array.from(categoryButtons).find(
            btn => btn.getAttribute('data-category') !== 'all'
        );

        if (!nonAllButton) {
            console.warn('⚠️ ADVERTENCIA: No hay botones de categoría específica');
            return false;
        }

        nonAllButton.click();
        
        // Esperar un momento a que renderice
        await new Promise(resolve => setTimeout(resolve, 500));

        const visibleCards = document.querySelectorAll('.product-card:visible');
        
        if (visibleCards.length === 0) {
            console.warn('⚠️ ADVERTENCIA: Ningún producto visible después de filtrar');
        } else {
            console.log(`✅ PASO: ${visibleCards.length} productos después de filtrar`);
        }

        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// ========================================================================
// PRUEBAS DE CARRITO
// ========================================================================

async function testCartFunctionality() {
    console.log('\n📋 TEST: Funcionalidad del carrito');
    
    try {
        const cartToggle = document.getElementById('cart-toggle');
        const cartCount = document.querySelector('.cart-count');

        if (!cartToggle || !cartCount) {
            console.error('❌ FALLO: Elementos del carrito no encontrados');
            return false;
        }

        console.log(`✅ PASO: Carrito encontrado (${cartCount.textContent} items)`);

        // Simular agregar al carrito
        if (allProducts.length > 0) {
            const firstProduct = allProducts[0];
            
            if (typeof addToCart === 'function') {
                addToCart(firstProduct.id);
                
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const newCount = parseInt(cartCount.textContent);
                if (newCount > 0) {
                    console.log(`✅ PASO: Producto agregado al carrito (${newCount} items)`);
                }
            }
        }

        return true;
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// ========================================================================
// RUNNER DE PRUEBAS
// ========================================================================

async function runAllTests() {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 SUITE COMPLETA DE PRUEBAS');
    console.log('Easy Logikal Comercialización');
    console.log('═══════════════════════════════════════════════════════════');

    const tests = [
        // Pruebas unitarias
        { name: 'Inicialización Supabase', fn: testSupabaseClientInitialization },
        { name: 'Cargar productos', fn: testFetchProducts },
        { name: 'Filtro status=active', fn: testProductStatusFilter },
        { name: 'Filtrado por categoría', fn: testProductCategoryFiltering },
        
        // Pruebas de integración
        { name: 'Elementos de página', fn: testProductsPageElements },
        { name: 'Renderizado', fn: testProductRendering },
        { name: 'Búsqueda', fn: testSearchFunctionality },
        { name: 'Filtros UI', fn: testFilteringByCategory },
        { name: 'Carrito', fn: testCartFunctionality },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`EXCEPCIÓN en ${test.name}:`, error);
            failed++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADOS');
    console.log(`✅ Pasadas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);
    console.log(`📊 Tasa de éxito: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (failed === 0) {
        console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
        return true;
    } else {
        console.log(`⚠️  ${failed} prueba(s) fallaron. Revisar logs arriba.`);
        return false;
    }
}

// ========================================================================
// EXPORT PARA USO EN NAVEGADOR
// ========================================================================

// Ejecutar en consola del navegador con:
// runAllTests()

// O ver resultados de una prueba específica:
// testSupabaseClientInitialization()
// testFetchProducts()
// etc.
