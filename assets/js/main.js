/**
 * Easy Logikal Comercialización - Main JS
 * Handling Product Loading and Filtering
 */

// Global state for products
var allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const productContainer = document.getElementById('product-container');
    const categoryFilters = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('product-search');

    async function loadProducts() {
        const homeFeatured = document.getElementById('home-featured-products');
        if (!productContainer && !homeFeatured) return;
        
        try {
            console.log('Cargando productos desde Supabase...');
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .neq('status', 'deleted') // Cargar todos excepto eliminados
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            console.log('Productos cargados:', data.length);
            allProducts = data;
            
            // Actualizar categorías dinámicamente si estamos en la página de productos
            if (document.getElementById('category-filters')) {
                renderDynamicCategories();
            }

            if (productContainer) {
                applyAllFilters(); // Usar filtros iniciales en lugar de render directo
            }
            
            if (homeFeatured) {
                // Filtrar solo los activos para el inicio
                const activeOnes = allProducts.filter(p => p.status === 'active');
                renderFeatured(activeOnes, homeFeatured);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Si hay un error, dejamos el catálogo vacío o mostramos un error en la UI
            if (productContainer) {
                productContainer.innerHTML = `<p class="text-center py-4">Error al conectar con la base de datos. Por favor intenta de nuevo.</p>`;
            }
        }
    }

    function renderDynamicCategories() {
        const categoryList = document.getElementById('category-filters');
        if (!categoryList) return;

        // Preservar la categoría activa actual
        const activeBtn = categoryList.querySelector('.filter-btn.active');
        const currentActive = activeBtn ? activeBtn.getAttribute('data-category') : 'all';

        // Extraer todas las categorías únicas que tengan productos activos
        const allCategories = [...new Set(allProducts.map(p => p.category))].sort();

        const counts = { all: allProducts.length };
        allProducts.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });

        categoryList.innerHTML = `
            <li><button class="filter-btn ${currentActive === 'all' ? 'active' : ''}" data-category="all">Todos los productos <span class="count">(${counts.all})</span></button></li>
            ${allCategories.map(cat => `
                <li><button class="filter-btn ${currentActive === cat ? 'active' : ''}" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)} <span class="count">(${counts[cat] || 0})</span></button></li>
            `).join('')}
        `;

        // Re-vincular eventos a los nuevos botones
        categoryList.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                categoryList.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyAllFilters();
            });
        });
    }

    // Suscribirse a cambios en tiempo real en Supabase
    const productSubscription = supabaseClient
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
            console.log('Cambio detectado en productos:', payload);
            loadProducts(); // Recargar todo para mantener consistencia
        })
        .subscribe();

    await loadProducts();
    await loadMarketingBanners();
    await loadHomeFeatured();

    async function loadHomeFeatured() {
        const featuredContainer = document.getElementById('home-featured-products');
        if (!featuredContainer) return;

        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .eq('status', 'active')
                .limit(4); // Load first 4 for home

            if (error) throw error;
            renderFeatured(data, featuredContainer);
        } catch (error) {
            console.warn('Error cargando destacados:', error);
            // Fallback to static if needed
        }
    }

    function renderFeatured(items, container) {
        if (!container) return;
        container.innerHTML = items.map(product => `
            <div class="product-card" data-reveal="up" onclick="window.location.href='pages/producto.html?id=${product.id}'" style="cursor: pointer;">
                <div class="product-image">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    <img src="${product.image || 'https://via.placeholder.com/400'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">$${parseFloat(product.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="product-actions" onclick="event.stopPropagation()">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='pages/producto.html?id=${product.id}'">Ver Detalle</button>
                        <button class="btn btn-outline btn-sm" onclick="addToCart(${product.id})">Añadir al Carrito</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Let animations.js handle the reveal, just refresh ScrollTrigger
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    // Removed local reveal animations logic - now handled globally by animations.js


    // Advanced Search & Suggestions
    const searchSuggestions = document.createElement('div');
    searchSuggestions.className = 'search-suggestions';
    if (searchInput) {
        searchInput.parentElement.appendChild(searchSuggestions);

        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value;
            if (term.length < 2) {
                searchSuggestions.innerHTML = '';
                return;
            }

            // Real-time suggestions (mocking database search)
            const matches = allProducts.filter(p => 
                p.name.toLowerCase().includes(term.toLowerCase()) || 
                (p.sku && p.sku.toLowerCase().includes(term.toLowerCase()))
            ).slice(0, 5);

            renderSuggestions(matches);
        });
    }

    function renderSuggestions(matches) {
        if (matches.length === 0) {
            searchSuggestions.innerHTML = '<div class="suggestion-item">No se encontraron resultados</div>';
            return;
        }

        searchSuggestions.innerHTML = matches.map(p => `
            <div class="suggestion-item" onclick="window.location.href='producto.html?id=${p.id}'">
                <img src="${p.image}" alt="${p.name}">
                <div>
                    <div class="sug-name">${p.name}</div>
                    <div class="sug-price">$${parseFloat(p.price).toLocaleString('es-MX')}</div>
                </div>
            </div>
        `).join('');
    }

    // Quick Quote Modal Logic
    function injectQuoteModal() {
        if (document.getElementById('quote-modal')) return;
        const modalHTML = `
            <div class="modal" id="quote-modal">
                <div class="modal-content quote-modal-content">
                    <span class="close-modal-btn" onclick="closeQuoteModal()">&times;</span>
                    <div class="quote-header">
                        <div class="quote-icon">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h2>Solicitar Cotización <span>Express</span></h2>
                        <p>Completa tus datos y un asesor te contactará en menos de 24 horas.</p>
                    </div>
                    <form id="quick-quote-form" class="mt-2 quote-form-grid">
                        <div class="form-group">
                            <label><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Nombre Completo</label>
                            <input type="text" id="q-name" placeholder="Ej. Juan Pérez" required>
                        </div>
                        <div class="form-group">
                            <label><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> WhatsApp / Teléfono</label>
                            <input type="tel" id="q-phone" placeholder="55 1234 5678" required>
                        </div>
                        <div class="form-group full-width">
                            <label><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg> Producto de Interés</label>
                            <input type="text" id="q-product" placeholder="Nombre del producto o categoría">
                        </div>
                        <div class="form-group full-width">
                            <label><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Mensaje</label>
                            <textarea id="q-message" rows="3" placeholder="¿Cuántas piezas necesitas?"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg w-100 mt-1" id="q-submit">
                            <span>ENVIAR SOLICITUD</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const qForm = document.getElementById('quick-quote-form');
        if (qForm) {
            qForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('q-submit');
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;

                try {
                    const { error } = await supabaseClient
                        .from('contacts')
                        .insert([{
                            name: document.getElementById('q-name').value,
                            email: 'quote@quick.form', // Placeholder for quick form
                            subject: 'Cotización Rápida: ' + document.getElementById('q-product').value,
                            message: `Tel: ${document.getElementById('q-phone').value}\n\nMensaje: ${document.getElementById('q-message').value}`
                        }]);

                    if (error) throw error;
                    alert('¡Solicitud enviada! Un asesor te contactará pronto.');
                    closeQuoteModal();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al enviar. Intenta de nuevo.');
                } finally {
                    submitBtn.textContent = 'Enviar Solicitud';
                    submitBtn.disabled = false;
                }
            });
        }
    }

    window.openQuoteModal = (productName = '') => {
        injectQuoteModal();
        document.getElementById('quote-modal').style.display = 'flex';
        if (productName) {
            document.getElementById('q-product').value = productName;
        }
    };

    window.closeQuoteModal = () => {
        const modal = document.getElementById('quote-modal');
        if (modal) modal.style.display = 'none';
    };

    // Global "Cotizar" button behavior
    document.querySelectorAll('.btn-primary').forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        if (btnText === 'cotizar' || btnText === 'contactar ahora') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openQuoteModal();
            });
        }
    });

    async function loadMarketingBanners() {
        const bannerContainer = document.getElementById('dynamic-banner-container');
        if (!bannerContainer) return;

        try {
            const { data, error } = await supabaseClient
                .from('marketing')
                .select('*')
                .eq('type', 'banner')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                const banner = data[0];
                bannerContainer.innerHTML = `
                    <div class="top-banner" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${banner.link}');">
                        <div class="container text-center py-1">
                            <p style="color: white; font-weight: 600; font-size: 0.9rem;">${banner.title}</p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.warn('Error cargando banners:', error);
        }
    }

    // Advanced Filtering Logic
    const priceRange = document.getElementById('price-range');
    const priceLabel = document.getElementById('price-max-label');
    const stockOnly = document.getElementById('stock-only');
    const sortProducts = document.getElementById('sort-products');
    const resetFilters = document.getElementById('reset-filters');
    const currentCount = document.getElementById('current-count');

    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            priceLabel.textContent = `$${parseInt(e.target.value).toLocaleString()}+`;
            applyAllFilters();
        });
    }

    if (stockOnly) stockOnly.addEventListener('change', applyAllFilters);
    if (sortProducts) sortProducts.addEventListener('change', applyAllFilters);
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            if (priceRange) {
                priceRange.value = 50000;
                priceLabel.textContent = '$50,000+';
            }
            if (stockOnly) stockOnly.checked = false;
            if (searchInput) searchInput.value = '';
            categoryFilters.forEach(b => b.classList.remove('active'));
            document.querySelector('[data-category="all"]').classList.add('active');
            applyAllFilters();
        });
    }

    function applyAllFilters() {
        const activeCategory = document.querySelector('.filter-btn.active')?.getAttribute('data-category') || 'all';
        const searchTerm = searchInput?.value || '';
        const maxPrice = priceRange ? parseInt(priceRange.value) : Infinity;
        const onlyInStock = stockOnly ? stockOnly.checked : false;
        const sortBy = sortProducts ? sortProducts.value : 'newest';

        let filtered = allProducts.filter(p => {
            const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesPrice = p.price <= maxPrice;
            const matchesStock = !onlyInStock || (p.stock && p.stock > 0);
            return matchesCategory && matchesSearch && matchesPrice && matchesStock;
        });

        // Sorting
        if (sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
        if (sortBy === 'name-az') filtered.sort((a, b) => a.name.localeCompare(b.name));
        if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        renderProducts(filtered);
        if (currentCount) currentCount.textContent = filtered.length;
        updateCategoryCounts();
    }

    function updateCategoryCounts() {
        const counts = { all: allProducts.length };
        allProducts.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            const cat = btn.getAttribute('data-category');
            const countSpan = btn.querySelector('.count');
            if (countSpan) countSpan.textContent = `(${counts[cat] || 0})`;
        });
    }

    function renderProducts(productsToRender) {
        if (!productContainer) return;
        
        if (productsToRender.length === 0) {
            productContainer.innerHTML = `
                <div class="no-results text-center py-4 w-100">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <h3 class="mt-1">No encontramos lo que buscas</h3>
                    <p class="text-muted">Intenta ajustar los filtros o el término de búsqueda.</p>
                </div>
            `;
            return;
        }

        productContainer.innerHTML = productsToRender.map(product => `
            <div class="product-card" data-reveal="up" onclick="window.location.href='producto.html?id=${product.id}'" style="cursor: pointer;">
                <div class="product-image">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    <img src="${product.image || 'https://via.placeholder.com/400'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-meta-small">
                        <span class="sku">SKU: ${product.sku || 'N/A'}</span>
                        <span class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${product.stock > 0 ? 'En Stock' : 'Agotado'}
                        </span>
                    </div>
                    <p class="product-price">$${parseFloat(product.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="product-actions" onclick="event.stopPropagation()">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='producto.html?id=${product.id}'">Ver Detalle</button>
                        <button class="btn btn-outline btn-sm" onclick="addToCart(${product.id})">Añadir al Carrito</button>
                    </div>
                </div>
            </div>
        `).join('');

        // GSAP Reveal for Catalog (Optimized)
        if (window.gsap) {
            gsap.from('.product-card', {
                scrollTrigger: {
                    trigger: productContainer,
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
    }

    // Initialize counts on first load
    setTimeout(updateCategoryCounts, 1000);

    // Initial Filter Check for URL params
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
        // Esperar un momento a que las categorías dinámicas se rendericen
        setTimeout(() => {
            const targetBtn = document.querySelector(`[data-category="${catParam}"]`);
            if (targetBtn) {
                const categoryList = document.getElementById('category-filters');
                if (categoryList) {
                    categoryList.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    targetBtn.classList.add('active');
                    applyAllFilters();
                }
            }
        }, 800);
    }

    // Filtering Logic (Override old simple filter)
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyAllFilters();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', applyAllFilters);
    }

    // Mobile Menu Logic with Performance focus
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Toggle body scroll and use transform for menu animation
            if (isActive) {
                document.body.style.overflow = 'hidden';
                // Small delay to ensure transform is ready
                requestAnimationFrame(() => {
                    navMenu.style.visibility = 'visible';
                });
            } else {
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    if (!navMenu.classList.contains('active')) {
                        navMenu.style.visibility = 'hidden';
                    }
                }, 400); // Match CSS transition duration
            }
        });
    }

    // Performance: Throttle Scroll Events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                scrollTimeout = null;
                // Scroll-based logic here if needed
            }, 50); // ~20fps for scroll logic is enough
        }
    }, { passive: true });
});

// Remove Blog logic if exists
function initBlog() {
    // Deleted system
}
