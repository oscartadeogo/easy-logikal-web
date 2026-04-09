/**
 * Easy Logikal Comercialización - Cart JS
 * Managing the shopping cart and checkout process
 * IMPORTANT: Functions must be in correct order - helpers before they're used
 */

let cart = [];
try {
    const savedCart = localStorage.getItem('easy_logikal_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
} catch (e) {
    console.warn('Error loading cart from localStorage:', e);
    cart = [];
}

// ============================================================================
// HELPER FUNCTIONS (MUST BE FIRST)
// ============================================================================
function saveCart() {
    localStorage.setItem('easy_logikal_cart', JSON.stringify(cart));
    console.log('💾 Carrito guardado en localStorage');
}

function openCart() {
    console.log('📂 Abriendo carrito...');
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (drawer && overlay) {
        drawer.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        console.log('✅ Carrito abierto');
    } else {
        console.log('⚠️ Cart drawer no encontrado, inyectando...');
        injectCartDrawer();
        const newDrawer = document.getElementById('cart-drawer');
        const newOverlay = document.getElementById('cart-overlay');
        if (newDrawer && newOverlay) {
            newDrawer.classList.add('open');
            newOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
            updateCartUI();
        }
    }
}

function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    document.body.style.overflow = 'auto';
}

function updateCartUI() {
    console.log('🔄 Actualizando UI del carrito...');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElements = document.querySelectorAll('.cart-count');

    if (!cartItemsContainer) {
        console.log('⚠️ cart-items container no existe');
        return;
    }

    // Update Counts
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    console.log(`📊 Total items: ${totalItems}`);
    cartCountElements.forEach(el => el.textContent = totalItems);

    // Empty Cart State
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-meli">
                <div class="empty-cart-icon">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
                <h2>Tu carrito está vacío</h2>
                <p>Agrega productos del mismo vendedor y consigue envío gratis.</p>
                <button class="btn btn-primary" onclick="closeCart(); window.location.href='pages/productos.html'">Descubrir productos</button>
                
                <div class="meli-summary-box">
                    <h4>Resumen de compra</h4>
                    <p>Aquí verás los importes de tu compra una vez que agregues productos.</p>
                </div>
                
                <div class="mt-4 text-left w-100">
                    <h4 style="font-size: 1rem; color: #333; margin-bottom: 1rem;">Recomendaciones para ti</h4>
                    <p style="font-size: 0.8rem; color: #999;">Explora nuestras líneas de productos destacadas.</p>
                </div>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    cartItemsContainer.innerHTML = `
        <div class="compact-cart-list">
            ${cart.map(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                return `
                    <div class="compact-cart-item">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" class="compact-cart-thumb" alt="${item.name}">
                        <div class="compact-cart-info">
                            <h4>${item.name}</h4>
                            <p>${item.quantity} × $${parseFloat(item.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button class="cart-item-remove" style="font-size: 1.2rem;" onclick="removeFromCart(${item.id})">×</button>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="compact-cart-subtotal">
            <h3>
                <span>SUBTOTAL:</span>
                <span>$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </h3>
            <div class="cart-actions-main">
                <button class="btn btn-outline w-100 mb-1" id="view-cart-btn" onclick="showFullCartView()">VER CARRITO</button>
                <button class="btn btn-primary w-100" id="checkout-view-btn" onclick="showCheckoutView()">FINALIZAR COMPRA</button>
            </div>
        </div>
    `;
}

// ============================================================================
// PUBLIC CART FUNCTIONS (Available for onclick handlers)
// ============================================================================
window.addToCart = function(productId) {
    console.log(`🛒 Intentando agregar producto ${productId}...`);
    console.log(`✓ easyLogikal inicializado:`, window.easyLogikal?.initialized);
    console.log(`✓ Productos disponibles:`, window.easyLogikal?.allProducts?.length);
    
    if (!window.easyLogikal?.initialized || !window.easyLogikal?.allProducts) {
        alert('Los productos aún se están cargando. Por favor espera un momento...');
        console.warn('❌ Productos no disponibles');
        return;
    }
    
    const product = window.easyLogikal.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error(`❌ Producto ${productId} no encontrado`);
        alert('Producto no encontrado');
        return;
    }

    console.log(`✅ Encontrado: ${product.name}`);

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
        console.log(`📦 Cantidad actualizada a ${existingItem.quantity}`);
    } else {
        cart.push({...product, quantity: 1});
        console.log(`🆕 Producto agregado`);
    }

    saveCart();
    updateCartUI();
    openCart();
    alert(`✅ ${product.name} añadido al carrito`);
};

window.updateDetailQty = function(delta) {
    const input = document.getElementById('detail-qty');
    if (!input) {
        console.warn('⚠️ detail-qty input no encontrado');
        return;
    }
    
    let currentQty = parseInt(input.value) || 1;
    const newQty = currentQty + delta;
    
    if (newQty >= 1) {
        input.value = newQty;
        console.log(`✏️ Cantidad: ${newQty}`);
    }
};

window.addToCartWithQty = function(productId) {
    console.log(`🛒 Agregando con cantidad - Producto ${productId}...`);
    
    if (!window.easyLogikal?.initialized || !window.easyLogikal?.allProducts) {
        alert('Los productos aún se están cargando. Por favor espera...');
        return;
    }
    
    const product = window.easyLogikal.allProducts.find(p => p.id === productId);
    if (!product) {
        console.error(`❌ Producto ${productId} no encontrado`);
        alert('Producto no encontrado');
        return;
    }

    const qtyInput = document.getElementById('detail-qty');
    const quantity = Math.max(1, parseInt(qtyInput?.value) || 1);

    console.log(`✅ Añadiendo ${quantity}× ${product.name}`);

    let existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({...product, quantity: quantity});
    }

    saveCart();
    updateCartUI();
    openCart();
    alert(`✅ ${quantity}× ${product.name} agregado al carrito`);
};

window.removeFromCart = function(productId) {
    console.log(`🗑️ Removiendo producto ${productId}...`);
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
};

window.updateQuantity = function(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.showCartView = function() {
    document.getElementById('cart-view-container').style.display = 'block';
    document.getElementById('checkout-view-container').style.display = 'none';
};

window.showCheckoutView = function() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    document.getElementById('cart-view-container').style.display = 'none';
    document.getElementById('checkout-view-container').style.display = 'block';
    updateCheckoutUI();
};

window.showFullCartView = function() {
    openCart();
};

window.toggleShippingAddress = function() {
    const fields = document.getElementById('shipping-address-fields');
    fields.style.display = document.getElementById('f-diff-address').checked ? 'block' : 'none';
};

// ============================================================================
// CHECKOUT FUNCTIONS
// ============================================================================
function updateCheckoutUI() {
    const list = document.getElementById('checkout-items-list');
    const totals = document.getElementById('checkout-totals');
    
    let subtotal = 0;
    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="summary-row">
                <span>${item.name} × ${item.quantity}</span>
                <span>$${itemTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
        `;
    }).join('');

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const shippingCost = (subtotal >= 499 || totalItems >= 2) ? 0 : 100;
    const total = subtotal + shippingCost;

    totals.innerHTML = `
        <div class="summary-row">
            <span>Subtotal</span>
            <span>$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="summary-row">
            <div>
                <span>Envío</span>
                <p style="font-size: 0.75rem; color: var(--text-muted);">
                    ${shippingCost === 0 ? 'Envío Gratuito' : 'Envío: $100.00'}
                </p>
            </div>
            <span>${shippingCost === 0 ? 'GRATIS' : '$100.00'}</span>
        </div>
        <div class="summary-row total">
            <span>Total</span>
            <span>$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
    `;
}

function injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const drawerHTML = `
        <div class="cart-drawer" id="cart-drawer">
            <div class="cart-drawer-header">
                <h2>Tu Pedido</h2>
                <button id="cart-close" onclick="closeCart()">&times;</button>
            </div>
            
            <div id="cart-view-container" class="cart-view-active">
                <div class="cart-items" id="cart-items">
                    <!-- Dynamic content -->
                </div>
            </div>

            <div id="checkout-view-container" style="display: none; overflow-y: auto; height: calc(100% - 70px); padding: 2rem;">
                <button class="btn btn-sm btn-outline mb-2" onclick="showCartView()">← Volver al carrito</button>
                <div class="checkout-section">
                    <h3>Detalles de Facturación</h3>
                    <div class="checkout-form-grid">
                        <div class="form-group full-width">
                            <label>Email *</label>
                            <input type="email" id="f-email" required>
                        </div>
                        <div class="form-group">
                            <label>Nombre *</label>
                            <input type="text" id="f-name" required>
                        </div>
                        <div class="form-group">
                            <label>Apellido *</label>
                            <input type="text" id="f-lname" required>
                        </div>
                        <div class="form-group full-width">
                            <label>País/Región *</label>
                            <select id="f-country">
                                <option value="MX">México</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label>Dirección De La Calle *</label>
                            <input type="text" id="f-address" required>
                        </div>
                        <div class="form-group full-width">
                            <label>Ciudad *</label>
                            <input type="text" id="f-city" required>
                        </div>
                    </div>
                </div>
                <div class="order-summary-box">
                    <h3>Tu Pedido</h3>
                    <div id="checkout-items-list"></div>
                    <div id="checkout-totals"></div>
                    <button class="btn btn-primary w-100 mt-2">REALIZAR PEDIDO</button>
                </div>
            </div>
        </div>
        <div class="cart-overlay" id="cart-overlay" onclick="closeCart()"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
}

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Cart...');
    injectCartDrawer();

    const cartToggle = document.getElementById('cart-toggle');
    const cartClose = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-btn');

    updateCartUI();

    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    waitForMainInit();
    console.log('✅ Cart inicializado');
});

function waitForMainInit() {
    if (window.easyLogikal?.initialized && window.easyLogikal?.allProducts) {
        console.log('✅ main.js listo, carrito sincronizado');
        return;
    }
    setTimeout(waitForMainInit, 100);
}

async function handleCheckout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    alert('Función de checkout en desarrollo');
}
