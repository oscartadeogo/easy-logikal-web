/**
 * Easy Logikal Comercialización - Main JS (Versión 2.0)
 * Reescrito completamente para resolver errores de scope y renderizado
 * ROBUSTO Y SIN ERRORES DE REFERENCIA
 */

// ============================================================================
// ESTADO GLOBAL
// ============================================================================
window.easyLogikal = {
    allProducts: [],
    supabase: null,
    initialized: false
};

// Fix 13: Flag de debug — cambiar a true solo en desarrollo
const DEBUG = false;
function log(...args) { if (DEBUG) console.log(...args); }

// ============================================================================
// INICIALIZACIÓN PRINCIPAL
// ============================================================================
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        console.log('🚀 Inicializando Easy Logikal...');
        
        // Cargar filtros desde URL antes de cualquier render
        loadFiltersFromURL();
        
        // Verificar que Supabase esté disponible
        if (typeof supabaseClient === 'undefined') {
            console.error('❌ supabaseClient no está disponible');
            showError('Error de configuración: Supabase no disponible');
            return;
        }
        
        window.easyLogikal.supabase = supabaseClient;
        
        // Cargar datos
        await loadAllProducts();
        await loadFeaturedProducts();
        await loadMarketingBanners();
        
        // Inicializar UI
        initializeFiltersUI();
        initializeEventListeners();
        setupRealtimeSubscription();
        
        window.easyLogikal.initialized = true;
        console.log('✅ Easy Logikal inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error durante inicialización:', error);
        showError('Error al inicializar la aplicación');
    }
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================
function showSkeletonLoaders(container, count = 8) {
    if (!container) return;
    container.innerHTML = Array(count).fill(`
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-price"></div>
        </div>
    `).join('');
}

async function loadAllProducts() {
    try {
        console.log('📦 Cargando todos los productos...');
        
        // Mostrar skeleton loaders mientras carga
        const container = document.getElementById('product-container');
        if (container) showSkeletonLoaders(container);
        
        const { data, error } = await window.easyLogikal.supabase
            .from('products')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`✅ ${data.length} productos cargados`);
        window.easyLogikal.allProducts = data || [];
        
        // Actualizar categorías dinámicas
        updateDynamicCategories();
        
        // Renderizar en catálogo si existe
        if (container) {
            applyAllFilters();
        }
        
        return window.easyLogikal.allProducts;
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        const container = document.getElementById('product-container');
        if (container) {
            showError('Error al cargar productos. Por favor, intenta de nuevo.');
        }
        return [];
    }
}

async function loadFeaturedProducts() {
    const container = document.getElementById('home-featured-products');
    if (!container) return;
    
    try {
        // Fix 14: Usar productos ya cargados en memoria en lugar de hacer una segunda query
        const featured = (window.easyLogikal.allProducts || []).slice(0, 4);
        if (featured.length > 0) {
            renderFeatured(featured, container);
            console.log(`✅ ${featured.length} destacados renderizados desde memoria`);
            return;
        }
        
        // Fallback: si allProducts aún no está cargado, hacer query
        console.log('⭐ Cargando productos destacados (fallback query)...');
        
        const { data, error } = await window.easyLogikal.supabase
            .from('products')
            .select('*')
            .neq('status', 'deleted')
            .limit(4);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            renderFeatured(data, container);
            console.log(`✅ ${data.length} destacados renderizados`);
        }
        
    } catch (error) {
        console.warn('⚠️ Error cargando destacados:', error);
    }
}

async function loadMarketingBanners() {
    const container = document.getElementById('dynamic-banner-container');
    if (!container) return;
    
    try {
        const { data, error } = await window.easyLogikal.supabase
            .from('marketing')
            .select('*')
            .eq('type', 'banner')
            .limit(1);
        
        if (error || !data || data.length === 0) return;
        
        const banner = data[0];
        if (banner && banner.image) {
            // Fix 1: Escapar banner.title para prevenir XSS
            const safeTitle = (banner.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            container.innerHTML = `
                <div class="top-banner" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${banner.image}');">
                    <div class="container text-center py-1">
                        <p style="color: white; font-weight: 600; font-size: 0.9rem;">${safeTitle}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.warn('⚠️ Error cargando banners:', error);
    }
}

// ============================================================================
// RENDERIZADO DE PRODUCTOS
// ============================================================================
function renderFeatured(items, container) {
    if (!container || !items) return;
    
    const html = items.map(product => createProductCard(product, 'featured')).join('');
    container.innerHTML = html;
    
    // Fix 15: Re-inicializar hover effects para las tarjetas destacadas
    if (typeof window.initCardHoverEffects === 'function') {
        window.initCardHoverEffects();
    }
    
    // Refresh wishlist buttons
    if (typeof window.refreshWishlistButtons === 'function') window.refreshWishlistButtons();
    
    // Refresh animations
    if (window.ScrollTrigger) ScrollTrigger.refresh();
}

function renderProducts(productsToRender) {
    const container = document.getElementById('product-container');
    if (!container) {
        console.error('❌ NO ENCONTRÉ product-container!');
        return;
    }
    
    log('📍 Container encontrado:', container);
    log('Display actual:', window.getComputedStyle(container).display);
    
    if (!productsToRender || productsToRender.length === 0) {
        container.innerHTML = `
            <div class="no-results text-center py-4 w-100">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3 class="mt-1">No encontramos lo que buscas</h3>
                <p class="text-muted">Intenta ajustar los filtros o el término de búsqueda.</p>
            </div>
        `;
        return;
    }
    
    const html = productsToRender.map(product => createProductCard(product, 'catalog')).join('');
    log(`📝 Renderizando ${productsToRender.length} productos...`);
    log('🔍 HTML generad:', html.substring(0, 300));
    
    // LIMPIAR para asegurar nuevos elementos
    container.innerHTML = '';
    
    // Insertar HTML lentamente
    container.innerHTML = html;
    
    log(`✅ ${productsToRender.length} tarjetas insertas`);
    log('📊 Total cards en DOM:', document.querySelectorAll('.product-card').length);
    log('🔍 Container HTML inners:', container.innerHTML.substring(0, 200));
    
    // GSAP animations — Fix 8: limitar al container, no a todas las .product-card del DOM
    if (window.gsap) {
        log('⚡ Aplicando animaciones GSAP...');
        gsap.from(container.querySelectorAll('.product-card'), {
            scrollTrigger: {
                trigger: container,
                start: 'top 90%'
            },
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.03,
            ease: 'power1.out',
            clearProps: 'all'
        });
    }
    
    // Actualizar contador
    const currentCount = document.getElementById('current-count');
    if (currentCount) {
        currentCount.textContent = productsToRender.length;
    }
    
    // Fix 15: Re-inicializar hover effects para las nuevas tarjetas renderizadas
    if (typeof window.initCardHoverEffects === 'function') {
        window.initCardHoverEffects();
    }
    
    // Refresh wishlist buttons
    if (typeof window.refreshWishlistButtons === 'function') window.refreshWishlistButtons();
}

function createProductCard(product, context = 'catalog') {
    // Validar URL de imagen
    let imageUrl = product.image || '';
    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'data' ||
        (imageUrl.startsWith('data:') && imageUrl.length < 100)) {
        imageUrl = 'https://via.placeholder.com/400?text=' + encodeURIComponent(product.name || 'Producto');
    }
    
    const price = parseFloat(product.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    
    // Fix 3: Asegurar que product.id sea numérico para evitar inyección en onclick
    const safeId = parseInt(product.id, 10);
    const isInPages = window.location.pathname.includes('/pages/');
    const productLink = isInPages ? `producto.html?id=${safeId}` : `pages/producto.html?id=${safeId}`;
    
    return `
        <div class="product-card" data-reveal="up" style="cursor: pointer; display: block;">
            <div class="product-image" onclick="window.location.href='${productLink}'" style="display: block;">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy" style="display: block; width: 100%; height: auto;">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                <button class="wishlist-btn" data-product-id="${safeId}" onclick="toggleWishlist(${safeId}, '${(product.name || '').replace(/'/g, "\\'")}'); event.stopPropagation();" aria-label="Agregar a lista de deseos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
            </div>
            <div class="product-info" style="display: block;">
                <span class="product-category">${product.category || 'General'}</span>
                <h3 class="product-title" onclick="window.location.href='${productLink}'" style="cursor: pointer;">${product.name}</h3>
                ${product.badge ? `<div class="badge-info">${product.badge}</div>` : ''}
                <div class="product-meta-small">
                    ${product.sku ? `<span class="sku">SKU: ${product.sku}</span>` : ''}
                    <span class="stock-status ${(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${(product.stock || 0) > 0 ? `En Stock: ${product.stock} uds.` : 'Agotado'}
                    </span>
                </div>
                <p class="product-price" style="font-size: 1.25rem; font-weight: bold; color: var(--primary, #007bff);">$${price}</p>
            </div>
            <div class="product-actions" style="display: block; padding: 10px;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='${productLink}'; event.stopPropagation();">
                        Ver Detalle
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="addToCart(${safeId}); event.stopPropagation(); return false;">
                        Añadir al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// FILTRADO
// ============================================================================
function initializeFiltersUI() {
    const container = document.getElementById('category-filters');
    if (!container) return;
    
    // Extraer categorías dinámicamente y actualizar conteos
    updateDynamicCategories();
}

function updateDynamicCategories() {
    const container = document.getElementById('category-filters');
    if (!container || !window.easyLogikal.allProducts) return;
    
    // Fix 7: Preservar la categoría activa antes de reconstruir el DOM
    const activeBtn = container.querySelector('.filter-btn.active');
    const activeCategory = activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    
    // Obtener todas las categorías únicas de los productos
    const categories = [...new Set(
        (window.easyLogikal.allProducts || [])
            .map(p => p.category)
            .filter(c => c && c.trim() !== '')
            .sort()
    )];
    
    log('📂 Categorías dinámicas encontradas:', categories);
    
    // Contar productos por categoría
    const counts = { all: window.easyLogikal.allProducts.length };
    window.easyLogikal.allProducts.forEach(p => {
        const cat = p.category || 'Sin categoría';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    
    // Generar HTML dinámicamente
    let html = `<li><button class="filter-btn" data-category="all">Todos los productos <span class="count">(${counts.all})</span></button></li>`;
    
    categories.forEach(cat => {
        html += `<li><button class="filter-btn" data-category="${cat}">${cat} <span class="count">(${counts[cat] || 0})</span></button></li>`;
    });
    
    container.innerHTML = html;
    
    // Re-vincular eventos
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyAllFilters();
            e.preventDefault();
        });
    });
    
    // Fix 7: Restaurar el estado activo de la categoría seleccionada
    let restored = false;
    container.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === activeCategory) {
            btn.classList.add('active');
            restored = true;
        }
    });
    // Si no se restauró (categoría ya no existe), activar "all"
    if (!restored) {
        const allBtn = container.querySelector('[data-category="all"]');
        if (allBtn) allBtn.classList.add('active');
    }
    
    // Aplicar filtro de categoría desde URL si está pendiente
    if (window._pendingCatFilter) {
        const targetBtn = container.querySelector(`[data-category="${window._pendingCatFilter}"]`);
        if (targetBtn) {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
        }
        window._pendingCatFilter = null;
    }
    
    log('✅ Categorías dinámicas actualizadas');
}

function applyAllFilters() {
    const activeCategory = getActiveCategory();
    const searchTerm = getSearchTerm();
    const maxPrice = getPriceMax();
    const onlyInStock = getStockFilter();
    const sortBy = getSortBy();
    
    log(`🔍 Aplicando filtros: categoría=${activeCategory}, búsqueda="${searchTerm}", precio<=${maxPrice}, solo stock=${onlyInStock}, ordenar por=${sortBy}`);
    
    let filtered = (window.easyLogikal.allProducts || []).filter(product => {
        const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
        // Fix 9: Manejar product.name null/undefined para evitar TypeError
        const matchesSearch = !searchTerm || 
            (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPrice = !maxPrice || product.price <= maxPrice;
        const matchesStock = !onlyInStock || (product.stock || 0) > 0;
        
        return matchesCategory && matchesSearch && matchesPrice && matchesStock;
    });
    
    // Aplicar ordenamiento
    filtered = applySorting(filtered, sortBy);
    
    // Renderizar
    renderProducts(filtered);
    updateCategoryCounts();
    
    // Sincronizar filtros con URL
    syncFiltersToURL();
}

function applySorting(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name-az':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
        default:
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

function getActiveCategory() {
    const active = document.querySelector('.filter-btn.active');
    return active ? active.getAttribute('data-category') : 'all';
}

function getSearchTerm() {
    const input = document.getElementById('product-search');
    return input ? input.value.trim() : '';
}

function getPriceMax() {
    const slider = document.getElementById('price-range');
    if (!slider) return null;
    const value = parseInt(slider.value);
    return isNaN(value) ? null : value;
}

function getStockFilter() {
    const checkbox = document.getElementById('stock-only');
    return checkbox ? checkbox.checked : false;
}

function getSortBy() {
    const select = document.getElementById('sort-products');
    return select ? select.value : 'newest';
}

function updateCategoryCounts() {
    // Usar la función dinámica de categorías
    updateDynamicCategories();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
function initializeEventListeners() {
    // Categorías
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyAllFilters();
            e.preventDefault();
        });
    });
    
    // Búsqueda
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            applyAllFilters();
        }, 300));
        
        setupSearchSuggestions(searchInput);
    }
    
    // Precio
    const priceRange = document.getElementById('price-range');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            const label = document.getElementById('price-max-label');
            if (label) {
                label.textContent = `$${parseInt(e.target.value).toLocaleString()}+`;
            }
            applyAllFilters();
        });
    }
    
    // Stock
    const stockOnly = document.getElementById('stock-only');
    if (stockOnly) {
        stockOnly.addEventListener('change', applyAllFilters);
    }
    
    // Ordenamiento
    const sortSelect = document.getElementById('sort-products');
    if (sortSelect) {
        sortSelect.addEventListener('change', applyAllFilters);
    }
    
    // Limpiar filtros
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
    }
}

function resetAllFilters() {
    // Reset búsqueda
    const searchInput = document.getElementById('product-search');
    if (searchInput) searchInput.value = '';
    
    // Reset precio
    const priceRange = document.getElementById('price-range');
    if (priceRange) {
        priceRange.value = 50000;
        const label = document.getElementById('price-max-label');
        if (label) label.textContent = '$50,000+';
    }
    
    // Reset stock
    const stockOnly = document.getElementById('stock-only');
    if (stockOnly) stockOnly.checked = false;
    
    // Reset categoría
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('[data-category="all"]');
    if (allBtn) allBtn.classList.add('active');
    
    // Replicar filtros
    applyAllFilters();
}

function setupSearchSuggestions(searchInput) {
    const container = searchInput.parentElement;
    if (!container) return;
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'search-suggestions';
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.style.position = 'absolute';
    suggestionsDiv.style.top = '100%';
    suggestionsDiv.style.left = '0';
    suggestionsDiv.style.right = '0';
    suggestionsDiv.style.background = 'white';
    suggestionsDiv.style.border = '1px solid #ccc';
    suggestionsDiv.style.borderRadius = '4px';
    suggestionsDiv.style.zIndex = '1000';
    suggestionsDiv.style.maxHeight = '300px';
    suggestionsDiv.style.overflowY = 'auto';
    
    container.appendChild(suggestionsDiv);
    
    searchInput.addEventListener('input', debounce(() => {
        const term = searchInput.value.trim();
        
        if (term.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        const matches = (window.easyLogikal.allProducts || [])
            .filter(p => 
                p.name.toLowerCase().includes(term.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(term.toLowerCase()))
            )
            .slice(0, 5);
        
        if (matches.length === 0) {
            suggestionsDiv.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">No hay resultados</div>';
        } else {
            // Fix 2: Escapar p.name para prevenir XSS en sugerencias de búsqueda
            suggestionsDiv.innerHTML = matches.map(p => {
                const safeName = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `
                    <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.location.href='./pages/producto.html?id=${p.id}'">
                        <strong>${safeName}</strong><br>
                        <small style="color: #999;">$${(p.price || 0).toLocaleString('es-MX')}</small>
                    </div>
                `;
            }).join('');
        }
        
        suggestionsDiv.style.display = 'block';
    }, 200));
    
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput && !container.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================
function setupRealtimeSubscription() {
    if (!window.easyLogikal.supabase) return;
    
    try {
        window.easyLogikal.supabase
            .channel('public:products')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    console.log('🔔 Cambio detectado en productos:', payload);
                    loadAllProducts().then(() => {
                        // Actualizar categorías dinámicamente
                        updateDynamicCategories();
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Subscriptores activados para cambios en tiempo real');
                }
            });
    } catch (error) {
        console.warn('⚠️ No se pudo activar subscripción en tiempo real:', error);
    }
}

// ============================================================================
// UTILIDADES
// ============================================================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const container = document.getElementById('product-container');
    if (container) {
        container.innerHTML = `<div class="alert alert-danger" style="margin: 20px; padding: 20px;">${message}</div>`;
    }
}

// ============================================================================
// CARRITO
// ============================================================================
// Cart functionality is handled by cart.js
// The addToCart function is defined there to ensure proper product lookup
// from window.easyLogikal.allProducts

// ============================================================================
// FILTROS PERSISTENTES EN URL
// ============================================================================
function syncFiltersToURL() {
    const params = new URLSearchParams();
    const category = getActiveCategory();
    const search = getSearchTerm();
    const sort = getSortBy();
    const stock = getStockFilter();
    const price = getPriceMax();
    
    if (category && category !== 'all') params.set('cat', category);
    if (search) params.set('q', search);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (stock) params.set('stock', '1');
    if (price && price < 50000) params.set('price', price);
    
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.replaceState(null, '', newUrl);
}

function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    const cat = params.get('cat');
    const q = params.get('q');
    const sort = params.get('sort');
    const stock = params.get('stock');
    const price = params.get('price');
    
    if (q) {
        const searchInput = document.getElementById('product-search');
        if (searchInput) searchInput.value = q;
    }
    if (sort) {
        const sortSelect = document.getElementById('sort-products');
        if (sortSelect) sortSelect.value = sort;
    }
    if (stock === '1') {
        const stockOnly = document.getElementById('stock-only');
        if (stockOnly) stockOnly.checked = true;
    }
    if (price) {
        const priceRange = document.getElementById('price-range');
        const priceLabel = document.getElementById('price-max-label');
        if (priceRange) priceRange.value = price;
        if (priceLabel) priceLabel.textContent = `$${parseInt(price).toLocaleString()}+`;
    }
    
    // Store cat for after categories load
    if (cat) window._pendingCatFilter = cat;
}

// ============================================================================
// BACK TO TOP
// ============================================================================
(function() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

// ============================================================================
// VIEW TOGGLE (Grid/List)
// ============================================================================
(function() {
    const toggleBtns = document.querySelectorAll('.view-btn');
    const grid = document.getElementById('product-container');
    if (!toggleBtns.length || !grid) return;
    
    const savedView = localStorage.getItem('el_view') || 'grid';
    if (savedView === 'list') {
        grid.classList.add('list-view');
        toggleBtns.forEach(b => b.classList.toggle('active', b.dataset.view === 'list'));
    }
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            grid.classList.toggle('list-view', view === 'list');
            localStorage.setItem('el_view', view);
        });
    });
})();

// ============================================================================
// DARK MODE TOGGLE
// ============================================================================
(function() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    
    const saved = localStorage.getItem('el_theme') || 'light';
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    
    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('el_theme', isDark ? 'light' : 'dark');
    });
})();
