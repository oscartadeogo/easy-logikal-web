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
    if (document.getElementById('cart-drawer')) return;

    const drawerHTML = `
        <div class="cart-drawer" id="cart-drawer">
            <div class="cart-drawer-header">
                <h2>Tu Pedido</h2>
                <button id="cart-close">&times;</button>
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
                            <input type="text" id="f-address" placeholder="Número de casa y nombre de la calle" required>
                        </div>
                        <div class="form-group full-width">
                            <label>Colonia, Apartamento, Habitación, Escalera, Etc. (Opcional)</label>
                            <input type="text" id="f-extra">
                        </div>
                        <div class="form-group">
                            <label>Localidad / Ciudad *</label>
                            <input type="text" id="f-city" required>
                        </div>
                        <div class="form-group">
                            <label>Región / Estado *</label>
                            <input type="text" id="f-state" required>
                        </div>
                        <div class="form-group">
                            <label>Código Postal *</label>
                            <input type="text" id="f-zip" required>
                        </div>
                        <div class="form-group">
                            <label>Teléfono *</label>
                            <input type="tel" id="f-phone" required>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <label class="checkbox-item">
                            <input type="checkbox" id="f-newsletter">
                            Sign Me Up To Receive Email Updates And News (Opcional)
                        </label>
                    </div>

                    <div class="mt-2">
                        <label class="checkbox-item" onclick="toggleShippingAddress()">
                            <input type="checkbox" id="f-diff-address">
                            ¿Enviar A Una Dirección Diferente?
                        </label>
                    </div>

                    <div id="shipping-address-fields" style="display: none; margin-top: 2rem; padding-top: 2rem; border-top: 1px dashed var(--border);">
                        <h3>Dirección de Envío</h3>
                        <div class="checkout-form-grid">
                            <div class="form-group">
                                <label>Nombre *</label>
                                <input type="text" id="s-name">
                            </div>
                            <div class="form-group">
                                <label>Apellido *</label>
                                <input type="text" id="s-lname">
                            </div>
                            <div class="form-group full-width">
                                <label>País/Región *</label>
                                <select id="s-country">
                                    <option value="MX">México</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label>Dirección De La Calle *</label>
                                <input type="text" id="s-address">
                            </div>
                            <div class="form-group full-width">
                                <label>Colonia, Apartamento, Habitación, Escalera, Etc. (Opcional)</label>
                                <input type="text" id="s-extra">
                            </div>
                            <div class="form-group">
                                <label>Localidad / Ciudad *</label>
                                <input type="text" id="s-city">
                            </div>
                            <div class="form-group">
                                <label>Región / Estado *</label>
                                <input type="text" id="s-state">
                            </div>
                            <div class="form-group">
                                <label>Código Postal *</label>
                                <input type="text" id="s-zip">
                            </div>
                        </div>
                    </div>

                    <div class="form-group full-width mt-2">
                        <label>Indicaciones Del Pedido (Opcional)</label>
                        <textarea id="f-notes" rows="3" placeholder="Notas sobre tu pedido, ej. notas especiales para la entrega."></textarea>
                    </div>
                </div>

                <div class="order-summary-box">
                    <h3>Tu Pedido</h3>
                    <div id="checkout-items-list"></div>
                    <div id="checkout-totals"></div>
                    
                    <div class="payment-methods">
                        <label class="payment-option">
                            <input type="radio" name="payment" value="paypal" checked>
                            <span>PayPal <strong>PayPal</strong></span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="mercadopago_cash">
                            <span>Pagos Sin Tarjeta De Mercado Pago</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="mercadopago">
                            <span>Mercado Pago <strong>Mercado Pago</strong></span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="card">
                            <span>Tarjeta De Crédito O Débito</span>
                        </label>
                    </div>

                    <p class="legal-text mt-2" style="font-size: 0.8rem; color: var(--text-muted);">
                        Tus datos personales se utilizarán para procesar tu pedido, mejorar tu experiencia en esta web y otros propósitos descritos en nuestra política de privacidad.
                    </p>
                    
                    <label class="checkbox-item mt-1" style="font-size: 0.85rem;">
                        <input type="checkbox" id="f-terms" required>
                        He Leído Y Estoy De Acuerdo Con Los Términos Y Condiciones Del Sitio Web *
                    </label>

                    <button class="btn btn-primary w-100 mt-2" id="place-order-btn">REALIZAR PEDIDO</button>
                </div>
            </div>
        </div>
        <div class="cart-overlay" id="cart-overlay"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
}

function showCartView() {
    document.getElementById('cart-view-container').style.display = 'block';
    document.getElementById('checkout-view-container').style.display = 'none';
}

function showCheckoutView() {
    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }
    document.getElementById('cart-view-container').style.display = 'none';
    document.getElementById('checkout-view-container').style.display = 'block';
    updateCheckoutUI();
}

function showFullCartView() {
    // This could redirect to a dedicated page, or show a large modal
    // For now, we keep the drawer view but could expand it
    openCart();
}

function toggleShippingAddress() {
    const fields = document.getElementById('shipping-address-fields');
    fields.style.display = document.getElementById('f-diff-address').checked ? 'block' : 'none';
}

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
                    ${shippingCost === 0 ? 'Envío Gratuito En 2 Productos O Más' : 'Envío Estándar: $100.00'}
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

    if (!cartItemsContainer) return;

    // Update Counts
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);

    // Empty Cart State - Mercado Libre Style
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
