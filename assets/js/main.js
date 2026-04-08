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

// ============================================================================
// INICIALIZACIÓN PRINCIPAL
// ============================================================================
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        console.log('🚀 Inicializando Easy Logikal...');
        
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
async function loadAllProducts() {
    const container = document.getElementById('product-container');
    const homeFeatured = document.getElementById('home-featured-products');
    
    // Si no estamos en página de productos ni en home, no cargar
    if (!container && !homeFeatured) {
        console.log('ℹ️ No hay contenedor de productos en esta página');
        return;
    }
    
    try {
        console.log('📦 Cargando productos...');
        
        const { data, error } = await window.easyLogikal.supabase
            .from('products')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`✅ ${data.length} productos cargados`);
        window.easyLogikal.allProducts = data || [];
        
        // Renderizar en catálogo si existe
        if (container) {
            applyAllFilters();
        }
        
        return window.easyLogikal.allProducts;
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
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
        console.log('⭐ Cargando productos destacados...');
        
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
            container.innerHTML = `
                <div class="top-banner" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${banner.image}');">
                    <div class="container text-center py-1">
                        <p style="color: white; font-weight: 600; font-size: 0.9rem;">${banner.title || ''}</p>
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
    
    // Refresh animations
    if (window.ScrollTrigger) ScrollTrigger.refresh();
}

function renderProducts(productsToRender) {
    const container = document.getElementById('product-container');
    if (!container) return;
    
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
    console.log(`📝 Renderizando ${productsToRender.length} productos...`);
    console.log('🔍 Primer producto HTML:', html.substring(0, 200));
    container.innerHTML = html;
    console.log(`✅ ${productsToRender.length} tarjetas insertas en el DOM`);
    
    // GSAP animations
    if (window.gsap) {
        gsap.from('.product-card', {
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
}

function createProductCard(product, context = 'catalog') {
    // Validar URL de imagen
    let imageUrl = product.image || '';
    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'data') {
        imageUrl = 'https://via.placeholder.com/400?text=' + encodeURIComponent(product.name);
    }
    
    const price = parseFloat(product.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    
    // Detectar si estamos en /pages/ o en raíz
    const isInPages = window.location.pathname.includes('/pages/');
    const productLink = isInPages ? `producto.html?id=${product.id}` : `pages/producto.html?id=${product.id}`;
    
    return `
        <div class="product-card" data-reveal="up" style="cursor: pointer; display: block;">
            <div class="product-image" onclick="window.location.href='${productLink}'" style="display: block;">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy" style="display: block; width: 100%; height: auto;">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info" style="display: block;">
                <span class="product-category">${product.category || 'General'}</span>
                <h3 class="product-title" onclick="window.location.href='${productLink}'" style="cursor: pointer;">${product.name}</h3>
                ${product.badge ? `<div class="badge-info">${product.badge}</div>` : ''}
                <div class="product-meta-small">
                    ${product.sku ? `<span class="sku">SKU: ${product.sku}</span>` : ''}
                    <span class="stock-status ${(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${(product.stock || 0) > 0 ? 'En Stock' : 'Agotado'}
                    </span>
                </div>
                <p class="product-price" style="font-size: 1.25rem; font-weight: bold; color: var(--primary, #007bff);">$${price}</p>
            </div>
            <div class="product-actions" style="display: block; padding: 10px;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='${productLink}'; event.stopPropagation();">
                        Ver Detalle
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="addToCart(${product.id}); event.stopPropagation(); return false;">
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
    
    updateCategoryCounts();
}

function applyAllFilters() {
    const activeCategory = getActiveCategory();
    const searchTerm = getSearchTerm();
    const maxPrice = getPriceMax();
    const onlyInStock = getStockFilter();
    const sortBy = getSortBy();
    
    console.log(`🔍 Aplicando filtros: categoría=${activeCategory}, búsqueda="${searchTerm}", precio<=${maxPrice}, solo stock=${onlyInStock}, ordenar por=${sortBy}`);
    
    let filtered = (window.easyLogikal.allProducts || []).filter(product => {
        const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    const counts = { all: window.easyLogikal.allProducts.length };
    
    (window.easyLogikal.allProducts || []).forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const cat = btn.getAttribute('data-category');
        const countSpan = btn.querySelector('.count');
        if (countSpan) {
            countSpan.textContent = `(${counts[cat] || 0})`;
        }
    });
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
            suggestionsDiv.innerHTML = matches.map(p => `
                <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.location.href='./pages/producto.html?id=${p.id}'">
                    <strong>${p.name}</strong><br>
                    <small style="color: #999;">$${(p.price || 0).toLocaleString('es-MX')}</small>
                </div>
            `).join('');
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
                    loadAllProducts();
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
function addToCart(productId) {
    const product = (window.easyLogikal.allProducts || []).find(p => p.id === productId);
    if (!product) {
        alert('Producto no encontrado');
        return;
    }
    
    console.log(`🛒 Añadiendo a carrito:`, product.name);
    
    if (typeof window.cart !== 'undefined' && typeof window.cart.add === 'function') {
        window.cart.add(product);
    } else {
        // Fallback: guardar en localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    alert(`${product.name} añadido al carrito`);
}
