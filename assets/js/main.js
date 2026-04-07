/**
 * Easy Logikal Comercialización - Main JS
 * Handling Product Loading and Filtering
 */

const products = [
    {
        id: 1,
        name: "Maisto 1:24 Assembly Line - Ferrari",
        category: "maisto",
        price: 850.00,
        image: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=80&w=400",
        badge: "Premium"
    },
    {
        id: 2,
        name: "Keter Shed - Darwin 4x6",
        category: "keter",
        price: 12500.00,
        image: "https://images.unsplash.com/photo-1598501479159-8618034b7661?auto=format&fit=crop&q=80&w=400",
        badge: "Más Vendido"
    },
    {
        id: 3,
        name: "IKEA Billy Bookcase - Blanco",
        category: "ikea",
        price: 1499.00,
        image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=400",
        badge: ""
    },
    {
        id: 4,
        name: "Maisto 1:18 Special Edition - Mustang",
        category: "maisto",
        price: 1200.00,
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=400",
        badge: "Edición Especial"
    },
    {
        id: 5,
        name: "Keter Outdoor Storage Box",
        category: "keter",
        price: 3500.00,
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=400",
        badge: ""
    },
    {
        id: 6,
        name: "Logikal Plus - Industrial Shelving",
        category: "logikal",
        price: 2800.00,
        image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=400",
        badge: "Nuevo"
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    const productContainer = document.getElementById('product-container');
    const categoryFilters = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('product-search');

    // Cargar productos desde Supabase
    let allProducts = [];
    
    async function loadProducts() {
        if (!productContainer) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            allProducts = data;
            renderProducts(allProducts);
        } catch (error) {
            console.error('Error cargando productos:', error);
            productContainer.innerHTML = '<div class="error">Error al conectar con la base de datos. Asegúrate de haber ejecutado el SQL.</div>';
        }
    }

    await loadProducts();

    // Filtering Logic
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-category');
            filterProducts(category, searchInput?.value || '');
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
            filterProducts(activeCategory, e.target.value);
        });
    }

    function renderProducts(productsToRender) {
        if (!productContainer) return;
        
        if (productsToRender.length === 0) {
            productContainer.innerHTML = '<div class="no-results">No se encontraron productos en la base de datos.</div>';
            return;
        }

        productContainer.innerHTML = productsToRender.map(product => `
            <div class="product-card" data-reveal="up">
                <div class="product-image">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    <img src="${product.image || 'https://via.placeholder.com/400'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">$${parseFloat(product.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline btn-add-cart" onclick="addToCart(${product.id})">Agregar al Carrito</button>
                    <button class="btn btn-primary btn-add-cart">Ver Detalles</button>
                </div>
            </div>
        `).join('');

        // Trigger GSAP reveal for new items
        if (window.gsap) {
            gsap.from('.product-card', {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    }

    function filterProducts(category, searchTerm) {
        const filtered = allProducts.filter(p => {
            const matchesCategory = category === 'all' || p.category === category;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        renderProducts(filtered);
    }

    // Mobile Menu Logic
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Toggle body scroll
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
    }
});
