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

            console.log('Cambiando a sección:', target);

            // Update active state
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show/Hide sections
            document.querySelectorAll('.dashboard-section').forEach(sec => {
                sec.style.display = 'none';
            });
            
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.style.display = 'block';
            }

            if (target === 'analytics-section') {
                loadDashboardStats();
            }
            if (target === 'orders-section') {
                loadOrders();
            }
            if (target === 'marketing-section') {
                loadMarketingItems();
            }
            if (target === 'cms-section') {
                loadBlogPosts();
            }
            if (target === 'products-section') {
                loadAdminProducts();
            }
        });
    });

    async function loadMarketingItems() {
        try {
            const { data, error } = await supabaseClient
                .from('marketing')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    console.warn('Tabla marketing no encontrada. Por favor ejecuta el SQL.');
                    return;
                }
                throw error;
            }
            renderMarketingTable(data);
        } catch (error) {
            console.error('Error cargando marketing:', error);
        }
    }

    function renderMarketingTable(items) {
        const tableBody = document.getElementById('marketing-table-body');
        const activeBanners = document.getElementById('active-banners');
        const activeCoupons = document.getElementById('active-coupons');

        if (!tableBody) return;

        tableBody.innerHTML = items.map(item => `
            <tr>
                <td><span class="badge ${item.type}">${item.type.toUpperCase()}</span></td>
                <td><strong>${item.title}</strong></td>
                <td>${item.type === 'banner' ? `<a href="${item.link}" target="_blank">Ver Link</a>` : item.value}</td>
                <td><span style="color: ${item.status === 'active' ? 'green' : 'red'};">${item.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-edit" onclick="editMarketingItem('${item.id}')">Editar</button>
                    <button class="btn btn-delete" onclick="deleteMarketingItem('${item.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');

        if (activeBanners) activeBanners.textContent = items.filter(i => i.type === 'banner' && i.status === 'active').length;
        if (activeCoupons) activeCoupons.textContent = items.filter(i => i.type === 'discount' && i.status === 'active').length;
    }

    // Modal Marketing Helpers
    const marketingForm = document.getElementById('marketing-form');
    const addPromoBtn = document.getElementById('add-promo-btn');

    if (addPromoBtn) {
        addPromoBtn.addEventListener('click', () => {
            document.getElementById('marketing-modal-title').textContent = 'Nueva Promoción / Banner';
            marketingForm.reset();
            document.getElementById('m-id').value = '';
            toggleMarketingFields();
            openMarketingModal();
        });
    }

    if (marketingForm) {
        marketingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('m-id').value;
            const marketingData = {
                type: document.getElementById('m-type').value,
                title: document.getElementById('m-title').value,
                value: document.getElementById('m-value').value,
                link: document.getElementById('m-link').value,
                status: document.getElementById('m-status').value
            };

            try {
                if (id) {
                    const { error } = await supabaseClient.from('marketing').update(marketingData).eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseClient.from('marketing').insert([marketingData]);
                    if (error) throw error;
                }
                closeMarketingModal();
                loadMarketingItems();
            } catch (error) {
                console.error('Error guardando marketing:', error);
                alert('Error al guardar. Asegúrate de que la tabla "marketing" existe en Supabase.');
            }
        });
    }

    window.toggleMarketingFields = () => {
        const type = document.getElementById('m-type').value;
        const labelTitle = document.getElementById('m-label-title');
        const fieldValue = document.getElementById('m-field-value');
        const labelLink = document.getElementById('m-label-link');

        if (type === 'banner') {
            labelTitle.textContent = 'Título del Banner / Alt Text';
            fieldValue.style.display = 'none';
            labelLink.textContent = 'URL de la Imagen (Banner)';
        } else {
            labelTitle.textContent = 'Código del Cupón / Título';
            fieldValue.style.display = 'block';
            labelLink.textContent = 'Link de Acción (Opcional)';
        }
    };

    window.openMarketingModal = () => document.getElementById('marketing-modal').style.display = 'flex';
    window.closeMarketingModal = () => {
        document.getElementById('marketing-modal').style.display = 'none';
        document.getElementById('m-preview-container').style.display = 'none';
    };

    window.handleImageUpload = async (input) => {
        const file = input.files[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('m-preview');
            const container = document.getElementById('m-preview-container');
            preview.src = e.target.result;
            container.style.display = 'block';
            
            // Si el usuario quiere guardar el base64 directamente (no recomendado para banners grandes, pero útil para prototipos)
            // document.getElementById('m-link').value = e.target.result;
        };
        reader.readAsDataURL(file);

        // Upload to Supabase Storage (Simulated/Ready for integration)
        /*
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabaseClient.storage
            .from('marketing-assets')
            .upload(fileName, file);
        
        if (data) {
            const { publicUrl } = supabaseClient.storage.from('marketing-assets').getPublicUrl(fileName);
            document.getElementById('m-link').value = publicUrl;
        }
        */
        
        // Por ahora, solo informamos que se cargó
        alert('Imagen cargada localmente. En una fase final, esto se subirá a Supabase Storage. Por ahora puedes usar una URL de la web.');
    };

    window.editMarketingItem = async (id) => {
        try {
            const { data, error } = await supabaseClient.from('marketing').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('marketing-modal-title').textContent = 'Editar Marketing';
            document.getElementById('m-id').value = data.id;
            document.getElementById('m-type').value = data.type;
            document.getElementById('m-title').value = data.title;
            document.getElementById('m-value').value = data.value || '';
            document.getElementById('m-link').value = data.link || '';
            document.getElementById('m-status').value = data.status;

            // Show preview if banner
            if (data.type === 'banner' && data.link) {
                const preview = document.getElementById('m-preview');
                const container = document.getElementById('m-preview-container');
                preview.src = data.link;
                container.style.display = 'block';
            }

            toggleMarketingFields();
            openMarketingModal();
        } catch (error) {
            console.error('Error al cargar item para editar:', error);
            alert('Error al obtener datos del servidor. Verifica la tabla "marketing".');
        }
    };

    window.deleteMarketingItem = async (id) => {
        if (confirm('¿Eliminar este elemento de marketing?')) {
            try {
                const { error } = await supabaseClient.from('marketing').delete().eq('id', id);
                if (error) throw error;
                loadMarketingItems();
            } catch (error) {
                console.error('Error al eliminar:', error);
            }
        }
    };

    // BLOG CMS FUNCTIONS
    async function loadBlogPosts() {
        try {
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderBlogTable(data);
        } catch (error) {
            console.error('Error cargando blog:', error);
        }
    }

    function renderBlogTable(posts) {
        const container = document.getElementById('cms-table-body');
        if (!container) return;

        container.innerHTML = posts.map(p => `
            <tr>
                <td><strong>${p.title}</strong></td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td><span style="color: ${p.status === 'published' ? 'green' : 'orange'};">${p.status.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-edit" onclick="editBlogPost(${p.id})">Editar</button>
                    <button class="btn btn-delete" onclick="deleteBlogPost(${p.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    const blogForm = document.getElementById('blog-form');
    const addBlogBtn = document.querySelector('#cms-section .btn-add'); // El botón "+ Nueva Entrada"

    if (addBlogBtn) {
        addBlogBtn.addEventListener('click', () => {
            document.getElementById('blog-modal-title').textContent = 'Nueva Entrada de Blog';
            blogForm.reset();
            document.getElementById('b-id').value = '';
            openBlogModal();
        });
    }

    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('b-id').value;
            const blogData = {
                title: document.getElementById('b-title').value,
                summary: document.getElementById('b-summary').value,
                content: document.getElementById('b-content').value,
                image: document.getElementById('b-image').value,
                category: document.getElementById('b-category').value,
                status: document.getElementById('b-status').value
            };

            try {
                if (id) {
                    const { error } = await supabaseClient.from('posts').update(blogData).eq('id', id);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseClient.from('posts').insert([blogData]);
                    if (error) throw error;
                }
                closeBlogModal();
                loadBlogPosts();
            } catch (error) {
                console.error('Error guardando blog:', error);
                alert('Error al guardar blog. Asegúrate de que la tabla "posts" existe.');
            }
        });
    }

    window.openBlogModal = () => document.getElementById('blog-modal').style.display = 'flex';
    window.closeBlogModal = () => document.getElementById('blog-modal').style.display = 'none';

    window.editBlogPost = async (id) => {
        try {
            const { data, error } = await supabaseClient.from('posts').select('*').eq('id', id).single();
            if (error) throw error;

            document.getElementById('blog-modal-title').textContent = 'Editar Entrada de Blog';
            document.getElementById('b-id').value = data.id;
            document.getElementById('b-title').value = data.title;
            document.getElementById('b-summary').value = data.summary;
            document.getElementById('b-content').value = data.content;
            document.getElementById('b-image').value = data.image || '';
            document.getElementById('b-category').value = data.category || '';
            document.getElementById('b-status').value = data.status;

            openBlogModal();
        } catch (error) {
            console.error('Error cargando blog para editar:', error);
        }
    };

    window.deleteBlogPost = async (id) => {
        if (confirm('¿Eliminar esta entrada de blog?')) {
            try {
                const { error } = await supabaseClient.from('posts').delete().eq('id', id);
                if (error) throw error;
                loadBlogPosts();
            } catch (error) {
                console.error('Error al eliminar blog:', error);
            }
        }
    };

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

    async function loadDashboardStats() {
        try {
            // 1. Orders Stats
            const { data: orders, error: ordersError } = await supabaseClient
                .from('orders')
                .select('total, status, created_at');
            if (ordersError) throw ordersError;

            const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
            const pendingOrders = orders.filter(o => o.status === 'pending').length;
            const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

            document.getElementById('stat-sales').textContent = `$${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            document.getElementById('stat-pending').textContent = pendingOrders;
            document.getElementById('stat-avg').textContent = `$${avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

            // 2. Low Stock Stats
            const { data: products, error: productsError } = await supabaseClient
                .from('products')
                .select('name, stock, sku');
            if (productsError) throw productsError;

            const lowStockItems = products.filter(p => p.stock <= 5);
            document.getElementById('stat-low-stock').textContent = lowStockItems.length;
            renderLowStockAlerts(lowStockItems);

            // 3. Render Chart
            renderSalesChart(orders);

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    function renderLowStockAlerts(items) {
        const list = document.getElementById('low-stock-list');
        if (!list) return;
        
        if (items.length === 0) {
            list.innerHTML = '<li>✓ Inventario saludable</li>';
            return;
        }

        list.innerHTML = items.map(item => `
            <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <span>${item.name}</span>
                <span class="stock-alert-badge">${item.stock} en stock</span>
            </li>
        `).join('');
    }

    function renderSalesChart(orders) {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Group orders by date (last 7 days)
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
            labels.push(dateStr);
            
            const dayTotal = orders
                .filter(o => new Date(o.created_at).toDateString() === date.toDateString())
                .reduce((sum, o) => sum + (o.total || 0), 0);
            data.push(dayTotal);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas Diarias ($)',
                    data: data,
                    borderColor: '#c62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: value => '$' + value } }
                }
            }
        });
    }

    // Cargar estadísticas iniciales
    loadDashboardStats();

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
                sku: document.getElementById('p-sku').value,
                brand: document.getElementById('p-brand').value,
                description: document.getElementById('p-desc').value,
                long_description: document.getElementById('p-long-desc').value,
                tags: document.getElementById('p-tags').value.split(',').map(t => t.trim()),
                gallery: document.getElementById('p-gallery').value.split(',').map(t => t.trim()).filter(t => t !== ''),
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
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-brand').value = p.brand || '';
    document.getElementById('p-stock').value = p.stock || 110;
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-long-desc').value = p.long_description || '';
    document.getElementById('p-tags').value = (p.tags || []).join(', ');
    document.getElementById('p-gallery').value = (p.gallery || []).join(', ');
    document.getElementById('p-variants').value = JSON.stringify(p.variants || []);
    
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
