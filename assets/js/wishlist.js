/**
 * Easy Logikal — Wishlist (Lista de Deseos)
 * Persiste en localStorage
 */

const WISHLIST_KEY = 'el_wishlist';

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    } catch { return []; }
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

window.toggleWishlist = function(productId, productName) {
    const list = getWishlist();
    const idx = list.indexOf(productId);
    
    if (idx === -1) {
        list.push(productId);
        if (typeof showToast === 'function') showToast(`❤️ ${productName} guardado en tu lista`, 'info');
    } else {
        list.splice(idx, 1);
        if (typeof showToast === 'function') showToast(`${productName} eliminado de tu lista`, 'info');
    }
    
    saveWishlist(list);
    updateWishlistButtons();
};

function updateWishlistButtons() {
    const list = getWishlist();
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const id = parseInt(btn.dataset.productId, 10);
        btn.classList.toggle('active', list.includes(id));
        btn.setAttribute('aria-label', list.includes(id) ? 'Quitar de lista de deseos' : 'Agregar a lista de deseos');
    });
}

window.isInWishlist = function(productId) {
    return getWishlist().includes(productId);
};

document.addEventListener('DOMContentLoaded', updateWishlistButtons);
// Re-run after dynamic renders
window.refreshWishlistButtons = updateWishlistButtons;
