/**
 * Easy Logikal Comercialización - Admin Dashboard JS
 * INTEGRACIÓN REAL CON SUPABASE
 */

// 1. Verificar Sesión (Mock por ahora, se cambiará a Supabase Auth pronto)
if (localStorage.getItem('easy_logikal_admin') !== 'true') {
    window.location.href = 'index.html';
}

let adminProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('product-table-body');
    const productForm = document.getElementById('product-form');
    const addBtn = document.getElementById('add-product-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');

    // 1. Navigation Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (!target) return;

            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show/Hide sections
            document.querySelectorAll('.dashboard-section').forEach(sec => {
                sec.style.display = 'none';
            });
            document.getElementById(target).style.display = 'block';

            if (target === 'analytics-section') {
                initCharts();
            }
            if (target === 'orders-section') {
                loadOrders();
            }
        });
    });

    async function loadOrders() {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderOrdersTable(data);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        }
    }

    function renderOrdersTable(orders) {
        const container = document.getElementById('orders-table-body');
        if (!container || !orders) return;

        container.innerHTML = orders.map(ord => `
            <tr>
                <td>#${ord.id}</td>
                <td>${ord.customer_name}</td>
                <td>$${parseFloat(ord.total).toLocaleString('es-MX')}</td>
                <td><span style="color: ${getStatusColor(ord.status)}; font-weight: 600;">${ord.status.toUpperCase()}</span></td>
                <td>${new Date(ord.created_at).toLocaleDateString()}</td>
                <td><button class="btn btn-edit" onclick="viewOrderDetail(${ord.id})">Detalles</button></td>
            </tr>
        `).join('');
    }

    function getStatusColor(status) {
        const colors = {
            'pending': 'orange',
            'paid': 'blue',
            'shipped': 'purple',
            'delivered': 'green',
            'cancelled': 'red'
        };
        return colors[status] || 'black';
    }

    // 2. Charts Initialization
    function initCharts() {
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        const catCtx = document.getElementById('categoryChart').getContext('2d');

        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ventas ($)',
                    data: [12000, 19000, 3000, 5000, 20000, 30000],
                    borderColor: '#C62828',
                    tension: 0.4
                }]
            }
        });

        new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: ['Maisto', 'Keter', 'IKEA', 'Logikal Plus'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: ['#C62828', '#0A0A0A', '#FFD600', '#666666']
                }]
            }
        });
    }

    // Cargar productos iniciales
    await loadAdminProducts();

    // Abrir modal para agregar
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Agregar Producto';
            productForm.reset();
            document.getElementById('edit-id').value = '';
            openModal();
        });
    }

    // Guardar/Editar Producto
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            
            const productData = {
                name: document.getElementById('p-name').value,
                category: document.getElementById('p-category').value,
                price: parseFloat(document.getElementById('p-price').value),
                image: document.getElementById('p-image').value,
                stock: parseInt(document.getElementById('p-stock').value),
                variants: JSON.parse(document.getElementById('p-variants').value || '[]')
            };

            try {
                if (id) {
                    // Actualizar
                    const { error } = await supabaseClient
                        .from('products')
                        .update(productData)
                        .eq('id', id);
                    if (error) throw error;
                    alert('Producto actualizado con éxito');
                } else {
                    // Insertar
                    const { error } = await supabaseClient
                        .from('products')
                        .insert([productData]);
                    if (error) throw error;
                    alert('Producto creado con éxito');
                }
                
                closeModal();
                await loadAdminProducts();
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('Error al conectar con Supabase. Verifica el SQL y las Políticas RLS.');
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('easy_logikal_admin');
            window.location.href = 'index.html';
        });
    }
});

async function loadAdminProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        adminProducts = data;
        renderAdminTable();
    } catch (error) {
        console.error('Error cargando tabla admin:', error);
    }
}

function renderAdminTable() {
    const tableBody = document.getElementById('product-table-body');
    const totalProducts = document.getElementById('total-products');
    
    if (!tableBody) return;

    tableBody.innerHTML = adminProducts.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td><span style="text-transform: uppercase; font-size: 0.75rem; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${p.category}</span></td>
            <td>$${parseFloat(p.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            <td>
                <button class="btn btn-edit" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn btn-delete" onclick="deleteProduct(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');

    if (totalProducts) totalProducts.textContent = adminProducts.length;
}

function openModal() {
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

window.editProduct = (id) => {
    const p = adminProducts.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-image').value = p.image;
    
    openModal();
};

window.deleteProduct = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto de la base de datos real?')) {
        try {
            const { error } = await supabaseClient
                .from('products')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            await loadAdminProducts();
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar. Verifica las políticas RLS.');
        }
    }
};
