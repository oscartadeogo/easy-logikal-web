/**
 * Easy Logikal Comercialización - Cart JS
 * Managing the shopping cart and checkout process
 */

let cart = JSON.parse(localStorage.getItem('easy_logikal_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Cart Drawer if not exists
    injectCartDrawer();

    const cartToggle = document.getElementById('cart-toggle');
    const cartClose = document.getElementById('cart-close');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-btn');

    // UI Updates
    updateCartUI();

    // Toggle Cart Drawer
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

    // Checkout Logic
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            handleCheckout();
        });
    }
});

function injectCartDrawer() {
    if (document.getElementById('cart-drawer')) return; // Already exists

    const drawerHTML = `
        <div class="cart-drawer" id="cart-drawer">
            <div class="cart-drawer-header">
                <h2>Tu Carrito</h2>
                <button id="cart-close">&times;</button>
            </div>
            <div class="cart-items" id="cart-items">
                <p class="empty-cart-msg">Tu carrito está vacío.</p>
            </div>
            
            <div class="cart-customer-info" style="padding: 1rem; border-top: 1px solid var(--border);">
                <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-main);">Tus Datos</h4>
                <div class="form-group" style="margin-bottom: 0.5rem;">
                    <input type="text" id="cart-cust-name" placeholder="Nombre completo" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; font-size: 0.85rem;">
                </div>
                <div class="form-group">
                    <input type="email" id="cart-cust-email" placeholder="Correo electrónico" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; font-size: 0.85rem;">
                </div>
            </div>

            <div class="cart-payment-options" style="padding: 1rem; border-top: 1px solid var(--border);">
                <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-main);">Método de Pago</h4>
                <div style="margin-bottom: 0.5rem;">
                    <input type="radio" id="pay-card" name="payment-method" value="card" checked>
                    <label for="pay-card" style="font-size: 0.85rem; cursor: pointer;">Tarjeta Crédito / Débito (Stripe)</label>
                </div>
                <div>
                    <input type="radio" id="pay-transfer" name="payment-method" value="transfer">
                    <label for="pay-transfer" style="font-size: 0.85rem; cursor: pointer;">Transferencia Bancaria</label>
                </div>
            </div>

            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total estimado:</span>
                    <span id="cart-total-value">$0.00</span>
                </div>
                <button class="btn btn-primary w-100" id="checkout-btn">Proceder al Pago</button>
                <p class="cart-note">* Los precios son informativos para cotización.</p>
            </div>
        </div>
        <div class="cart-overlay" id="cart-overlay"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
}

function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('visible');
    document.body.style.overflow = 'auto';
}

function addToCart(productId) {
    // Note: products might be loaded from Supabase or mock
    // For now, we fetch the product from the current view or mock data if needed
    // In a real app, you'd fetch by ID from the state
    
    const product = window.allProducts?.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, delta) {
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
}

function saveCart() {
    localStorage.setItem('easy_logikal_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountElements = document.querySelectorAll('.cart-count');
    const cartTotalValue = document.getElementById('cart-total-value');

    if (!cartItemsContainer) return;

    // Update Counts
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);

    // Update List
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
        if (cartTotalValue) cartTotalValue.textContent = '$0.00';
        return;
    }

    let subtotal = 0;
    cartItemsContainer.innerHTML = `
        <div class="cart-header-row" style="display: grid; grid-template-columns: 30px 60px 1fr 80px 80px; gap: 10px; font-size: 0.7rem; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 10px;">
            <span>X</span>
            <span>Imagen</span>
            <span>Producto</span>
            <span>Precio</span>
            <span>Cantidad</span>
        </div>
    ` + cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item-modern" style="display: grid; grid-template-columns: 30px 60px 1fr 80px 80px; gap: 10px; align-items: center; margin-bottom: 15px; font-size: 0.85rem;">
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; cursor:pointer; color:red; font-weight:bold;">×</button>
                <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" style="width: 100%; border-radius: 4px;">
                <div style="font-weight: 600;">${item.name}</div>
                <div>$${parseFloat(item.price).toLocaleString('es-MX')}</div>
                <div class="qty-controls" style="display: flex; border: 1px solid var(--border); border-radius: 4px;">
                    <button onclick="updateQuantity(${item.id}, -1)" style="padding: 2px 5px; border:none; background:none; cursor:pointer;">-</button>
                    <span style="flex:1; text-align:center;">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" style="padding: 2px 5px; border:none; background:none; cursor:pointer;">+</button>
                </div>
            </div>
        `;
    }).join('');

    // Shipping Logic (Gratis > 499 o 2+ productos)
    const shippingCost = (subtotal >= 499 || totalItems >= 2) ? 0 : 100;
    const tax = subtotal * 0.16;
    const total = subtotal + tax + shippingCost;

    if (cartTotalValue) {
        cartTotalValue.innerHTML = `
            <div style="border-top: 2px solid var(--secondary); padding-top: 10px; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: ${shippingCost === 0 ? 'green' : 'inherit'};">
                    <span>Envío:</span>
                    <span>${shippingCost === 0 ? 'GRATIS' : '$' + shippingCost.toFixed(2)}</span>
                </div>
                ${shippingCost === 0 ? '<p style="font-size: 0.7rem; color: green; text-align: right; margin-bottom: 5px;">✓ Envío Gratuito Aplicado</p>' : ''}
                <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; color: var(--primary); margin-top: 10px;">
                    <span>TOTAL:</span>
                    <span>$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <p style="font-size: 0.7rem; color: #888; text-align: center; margin-top: 10px;">IVA Incluido (16%)</p>
            </div>
        `;
    }
}

async function handleCheckout() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'card';
    
    // Customer Info
    const custName = document.getElementById('cart-cust-name')?.value;
    const custEmail = document.getElementById('cart-cust-email')?.value;

    if (!custName || !custEmail) {
        alert('Por favor, completa tu nombre y correo para procesar la cotización.');
        return;
    }

    checkoutBtn.textContent = 'Procesando...';
    checkoutBtn.disabled = true;

    // Tax Calculation
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    // 1. WhatsApp Quote (Always good to have as backup)
    // sendWhatsAppQuote();

    try {
        // 2. Persist Order in Supabase
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([{
                customer_name: custName,
                customer_email: custEmail,
                items: cart,
                total: total,
                status: 'pending',
                payment_method: paymentMethod
            }]);

        if (error) throw error;

        // Simulation of redirect/success
        console.log(`Iniciando proceso de pago (${paymentMethod})...`);
        
        setTimeout(() => {
            if (paymentMethod === 'transfer') {
                alert('¡Pedido confirmado! Se han generado los datos para tu transferencia bancaria. Revisa tu correo.');
            } else {
                alert('Redirigiendo a pasarela de pago segura (Stripe/PayPal)...');
                alert('¡Pago completado con éxito!');
            }
            
            generateInvoice(cart, total);
            cart = [];
            saveCart();
            updateCartUI();
            closeCart();
            checkoutBtn.textContent = 'Proceder al Pago';
            checkoutBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error al procesar pedido:', error);
        alert('Hubo un problema al procesar tu pedido. Por favor intenta de nuevo.');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceder al Pago';
    }
}

function generateInvoice(items, total) {
    console.log('Generando facturación electrónica (Simulación CFDI)...');
    // En producción, aquí se llamaría a un servicio como Facturama o Quaderno
}
