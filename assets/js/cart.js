/**
 * Easy Logikal Comercialización - Cart JS
 * Managing the shopping cart and checkout process
 */

let cart = JSON.parse(localStorage.getItem('easy_logikal_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
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
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${parseFloat(item.price).toLocaleString('es-MX')} x ${item.quantity}</p>
                    <div class="quantity-controls mt-1">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
            </div>
        `;
    }).join('');

    // Tax Calculation (16% IVA México)
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    if (cartTotalValue) {
        cartTotalValue.innerHTML = `
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 400;">
                Subtotal: $${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}<br>
                IVA (16%): $${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div style="margin-top: 5px;">
                Total: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                customer_name: "Cliente Web", // En un flujo real, pediríamos estos datos
                customer_email: "cliente@ejemplo.com",
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
