/**
 * Easy Logikal Comercialización - Admin Dashboard JS
 * INTEGRACIÓN REAL CON SUPABASE + SISTEMA DE VARIANTES, IMÁGENES Y EDITOR MASIVO
 */

// 1. Verificar Sesión
if (localStorage.getItem('easy_logikal_admin') !== 'true') {
    window.location.href = 'index.html';
}

let adminProducts = [];
let deletedProducts = [];
let selectedProductIds = new Set();
let currentImageResolve = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Navigation
    setupNavigation();
    
    // Event Listeners for new features (Must load before async calls to be ready)
    setupProductEventListeners();
    setupBulkEditorEventListeners();
    setupExcelEventListeners();

    try {
        // Initial Load
        await loadAdminProducts();
        loadDashboardStats();
    } catch (e) {
        console.error('Error en carga inicial:', e);
    }
    
    // Initialize animations
    initDashboardAnimations();
});

// --- NAVIGATION ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (!target) return;

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
            const targetSection = document.getElementById(target);
            if (targetSection) targetSection.style.display = 'block';

            if (target === 'analytics-section' || target === 'dashboard-section') loadDashboardStats();
            if (target === 'orders-section') loadOrders();
            if (target === 'marketing-section') loadMarketingItems();
            if (target === 'products-section') loadAdminProducts();
        });
    });
}

// --- PRODUCT MANAGEMENT ---
async function loadAdminProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .neq('status', 'deleted')
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
    if (!tableBody) return;

    tableBody.innerHTML = adminProducts.map(p => `
        <tr class="${p.status === 'paused' ? 'paused-row' : ''}" style="${p.status === 'paused' ? 'opacity: 0.6; background: #f9f9f9;' : ''}">
            <td><input type="checkbox" class="product-checkbox" value="${p.id}" ${selectedProductIds.has(p.id.toString()) ? 'checked' : ''} onchange="toggleProductSelection(this)"></td>
            <td>#${p.id}</td>
            <td><strong>${p.name}</strong> ${p.status === 'paused' ? '<span style="font-size:0.7rem; color:orange;">[PAUSADO]</span>' : ''}</td>
            <td><span class="badge-cat">${p.category}</span></td>
            <td>$${parseFloat(p.price).toLocaleString('es-MX')}</td>
            <td>
                <select onchange="updateProductStatus(${p.id}, this.value)" style="font-size:0.8rem; padding:2px;">
                    <option value="active" ${p.status === 'active' ? 'selected' : ''}>Activo</option>
                    <option value="paused" ${p.status === 'paused' ? 'selected' : ''}>Pausado</option>
                </select>
            </td>
            <td>
                <button class="btn btn-edit" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn btn-delete" onclick="softDeleteProduct(${p.id})">Quitar</button>
            </td>
        </tr>
    `).join('');
    
    updateTotalProductsCount();
}

function updateTotalProductsCount() {
    const totalEl = document.getElementById('total-products');
    if (totalEl) totalEl.textContent = adminProducts.length;
}

// --- SELECTION & BULK ACTIONS ---
window.toggleProductSelection = (checkbox) => {
    if (checkbox.checked) {
        selectedProductIds.add(checkbox.value);
    } else {
        selectedProductIds.delete(checkbox.value);
    }
};

document.getElementById('select-all-products')?.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        if (e.target.checked) selectedProductIds.add(cb.value);
        else selectedProductIds.delete(cb.value);
    });
});

// --- BULK EDITOR LOGIC ---
function setupBulkEditorEventListeners() {
    const bulkBtn = document.getElementById('bulk-edit-btn');
    if (bulkBtn) {
        bulkBtn.addEventListener('click', () => {
            if (selectedProductIds.size === 0) {
                alert('Selecciona al menos un producto para editar masivamente.');
                return;
            }
            openBulkModal();
        });
    }

    // Update preview on value change
    document.getElementById('bulk-value-input')?.addEventListener('input', renderBulkPreview);
    document.getElementById('bulk-select-input')?.addEventListener('change', renderBulkPreview);
}

window.openBulkModal = () => {
    const modal = document.getElementById('bulk-edit-modal');
    modal.style.display = 'flex';
    document.getElementById('bulk-count-label').textContent = `Seleccionados: ${selectedProductIds.size} productos`;
    updateBulkUI();
};

window.closeBulkModal = () => {
    document.getElementById('bulk-edit-modal').style.display = 'none';
};

window.updateBulkUI = () => {
    const action = document.getElementById('bulk-action-type').value;
    const valueInput = document.getElementById('bulk-value-input');
    const selectInput = document.getElementById('bulk-select-input');
    const label = document.getElementById('bulk-value-label');

    valueInput.style.display = 'block';
    selectInput.style.display = 'none';

    if (action === 'price') label.textContent = 'Nuevo Precio ($):';
    if (action === 'stock') label.textContent = 'Nuevo Stock:';
    if (action === 'category') {
        label.textContent = 'Nueva Categoría:';
        valueInput.style.display = 'none';
        selectInput.style.display = 'block';
        selectInput.innerHTML = `
            <option value="juguetes">Juguetes y Coleccionables</option>
            <option value="muebles">Muebles de Exterior</option>
            <option value="hogar">Hogar y Oficina</option>
            <option value="logistica">Logística Industrial</option>
        `;
    }
    if (action === 'status') {
        label.textContent = 'Nuevo Estado:';
        valueInput.style.display = 'none';
        selectInput.style.display = 'block';
        selectInput.innerHTML = `<option value="active">Activo</option><option value="paused">Pausado</option>`;
    }
    if (action === 'shipping') {
        label.textContent = 'Envío Gratis:';
        valueInput.style.display = 'none';
        selectInput.style.display = 'block';
        selectInput.innerHTML = `<option value="true">Sí</option><option value="false">No</option>`;
    }
    if (action === 'delete') {
        label.textContent = 'Confirmación:';
        valueInput.style.display = 'none';
        selectInput.style.display = 'block';
        selectInput.innerHTML = `<option value="deleted">Mover a Papelera</option>`;
    }

    renderBulkPreview();
};

function renderBulkPreview() {
    const previewBody = document.getElementById('bulk-preview-body');
    const action = document.getElementById('bulk-action-type').value;
    const newVal = (action === 'category' || action === 'status' || action === 'shipping' || action === 'delete') 
        ? document.getElementById('bulk-select-input').value 
        : document.getElementById('bulk-value-input').value;
    
    const selectedProds = adminProducts.filter(p => selectedProductIds.has(p.id.toString()));
    
    previewBody.innerHTML = selectedProds.map(p => {
        let currentVal = p[action] || 'N/A';
        if (action === 'price') currentVal = `$${p.price}`;
        
        let displayNewVal = newVal || '...';
        if (action === 'price' && newVal) displayNewVal = `$${newVal}`;
        
        return `<tr><td>${p.name}</td><td>${currentVal}</td><td style="color: #E65100; font-weight: bold;">${displayNewVal}</td></tr>`;
    }).join('');
}

window.applyBulkChanges = async () => {
    const action = document.getElementById('bulk-action-type').value;
    const newValue = (action === 'category' || action === 'status' || action === 'delete') 
        ? document.getElementById('bulk-select-input').value 
        : document.getElementById('bulk-value-input').value;

    if (!newValue && action !== 'delete') {
        alert('Por favor ingresa un valor válido.');
        return;
    }

    if (!confirm(`¿Estás seguro de aplicar este cambio a ${selectedProductIds.size} productos?`)) return;

    try {
        const updateData = {};
        if (action === 'price') updateData.price = parseFloat(newValue);
        if (action === 'stock') updateData.stock = parseInt(newValue);
        if (action === 'category') updateData.category = newValue;
        if (action === 'status') updateData.status = newValue;
        if (action === 'shipping') updateData.shipping_info = { free_shipping: (newValue === 'true'), cost: 0 };
        if (action === 'delete') updateData.status = 'deleted';

        const { error } = await supabaseClient
            .from('products')
            .update(updateData)
            .in('id', Array.from(selectedProductIds));

        if (error) throw error;

        alert('Cambios masivos aplicados con éxito.');
        closeBulkModal();
        selectedProductIds.clear();
        document.getElementById('select-all-products').checked = false;
        await loadAdminProducts();
    } catch (error) {
        console.error('Error en edición masiva:', error);
        alert('Error al aplicar cambios.');
    }
};

// --- EXCEL EXPORT ---
function setupExcelEventListeners() {
    document.getElementById('export-excel-btn')?.addEventListener('click', () => {
        exportProductsToExcel();
    });
}

function exportProductsToExcel() {
    if (adminProducts.length === 0) {
        alert('No hay productos para exportar.');
        return;
    }

    const data = adminProducts.map(p => ({
        ID: p.id,
        Nombre: p.name,
        SKU: p.sku,
        Precio: p.price,
        Stock: p.stock,
        Categoría: p.category,
        Marca: p.brand,
        Estado: p.status,
        Descripción: p.description,
        Fecha_Creación: new Date(p.created_at).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    // Auto-width columns
    const maxWidths = {};
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            const val = String(row[key]);
            maxWidths[key] = Math.max(maxWidths[key] || 0, val.length);
        });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 5 }));

    XLSX.writeFile(workbook, `Productos_EasyLogikal_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// --- DELETED PRODUCTS (PAPELERA) ---
window.toggleDeletedSection = async () => {
    const container = document.getElementById('deleted-products-container');
    const icon = document.getElementById('deleted-toggle-icon');
    
    if (container.style.display === 'none') {
        await loadDeletedProducts();
        container.style.display = 'block';
        icon.textContent = '▲';
    } else {
        container.style.display = 'none';
        icon.textContent = '▼';
    }
};

async function loadDeletedProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('status', 'deleted')
            .order('created_at', { ascending: false });

        if (error) throw error;
        deletedProducts = data;
        renderDeletedTable();
    } catch (error) {
        console.error('Error cargando papelera:', error);
    }
}

function renderDeletedTable() {
    const tableBody = document.getElementById('deleted-product-table-body');
    if (!tableBody) return;

    if (deletedProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#888;">La papelera está vacía</td></tr>';
        return;
    }

    tableBody.innerHTML = deletedProducts.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td>${p.name}</td>
            <td>$${p.price}</td>
            <td>
                <button class="btn" style="background:#E8F5E9; color:#2E7D32; font-size:0.7rem;" onclick="restoreProduct(${p.id})">Reactivar</button>
                <button class="btn" style="background:#FFEBEE; color:#D32F2F; font-size:0.7rem;" onclick="permanentDeleteProduct(${p.id})">Eliminar Permanente</button>
            </td>
        </tr>
    `).join('');
}

window.restoreProduct = async (id) => {
    try {
        const { error } = await supabaseClient.from('products').update({ status: 'active' }).eq('id', id);
        if (error) throw error;
        await loadDeletedProducts();
        await loadAdminProducts();
    } catch (error) {
        console.error('Error restaurando:', error);
    }
};

window.softDeleteProduct = async (id) => {
    if (!confirm('¿Mover este producto a la papelera?')) return;
    try {
        const { error } = await supabaseClient.from('products').update({ status: 'deleted' }).eq('id', id);
        if (error) throw error;
        await loadAdminProducts();
    } catch (error) {
        console.error('Error quitando producto:', error);
    }
};

window.permanentDeleteProduct = async (id) => {
    if (!confirm('¿ESTÁS SEGURO? Esta acción no se puede deshacer y el producto se borrará permanentemente.')) return;
    try {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) throw error;
        await loadDeletedProducts();
    } catch (error) {
        console.error('Error eliminando permanente:', error);
    }
};

// --- UI HELPERS ---
window.toggleUrlInput = (id) => {
    const container = document.getElementById(id);
    container.style.display = container.style.display === 'block' ? 'none' : 'block';
};

window.updateMainPreview = (url) => {
    const preview = document.getElementById('main-image-preview');
    const uploadText = document.querySelector('#main-image-dropzone .upload-text');
    const uploadIcon = document.querySelector('#main-image-dropzone .upload-icon');
    
    if (url && url.length > 5) {
        preview.src = url;
        preview.style.display = 'block';
        if (uploadText) uploadText.style.display = 'none';
        if (uploadIcon) uploadIcon.style.display = 'none';
        document.getElementById('p-image').value = url;
    } else {
        preview.style.display = 'none';
        if (uploadText) uploadText.style.display = 'block';
        if (uploadIcon) uploadIcon.style.display = 'block';
    }
};

// --- CATEGORY TOGGLE ---
window.toggleCustomCategory = () => {
    const select = document.getElementById('p-category');
    const customInput = document.getElementById('p-category-custom');
    if (select.value === 'otro') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
};

// --- DRAG AND DROP ---
function setupDropzone(id, onFile) {
    const zone = document.getElementById(id);
    if (!zone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        zone.addEventListener(name, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(name => {
        zone.addEventListener(name, () => zone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(name => {
        zone.addEventListener(name, () => zone.classList.remove('dragover'), false);
    });

    zone.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) onFile(file);
    }, false);
}

// --- GALLERY MANAGEMENT ---
window.addGalleryUploadZone = (url = '') => {
    const container = document.getElementById('gallery-zones-container');
    const zId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    const html = `
        <div class="form-group" id="gz-${zId}" style="position:relative;">
            <div class="image-upload-zone" style="padding: 1rem; min-height: 120px;" id="gz-drop-${zId}" onclick="document.getElementById('gz-file-${zId}').click()">
                <span class="gz-icon-${zId}" style="${url ? 'display:none' : ''}">🖼️</span>
                <img id="gz-prev-${zId}" src="${url}" class="image-preview-main" style="${url ? 'display:block; max-height:100px;' : ''}">
                <input type="file" id="gz-file-${zId}" accept="image/*" style="display:none;" onchange="handleGalleryZoneUpload(this, '${zId}')">
            </div>
            <span onclick="removeGalleryZone('${zId}')" style="position:absolute; top:-5px; right:-5px; background:#ff5252; color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; z-index:10;">×</span>
            <input type="hidden" class="gz-url" value="${url}">
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    
    setupDropzone(`gz-drop-${zId}`, (file) => {
        handleGalleryZoneUpload({ files: [file] }, zId);
    });
};

window.handleGalleryZoneUpload = (input, zId) => {
    handleImageProcessing(input, '', (url) => {
        const prev = document.getElementById(`gz-prev-${zId}`);
        prev.src = url;
        prev.style.display = 'block';
        document.querySelector(`#gz-${zId} .gz-icon-${zId}`).style.display = 'none';
        document.querySelector(`#gz-${zId} .gz-url`).value = url;
    });
};

window.removeGalleryZone = (zId) => {
    document.getElementById(`gz-${zId}`).remove();
};

function getGalleryFromZones() {
    const inputs = document.querySelectorAll('.gz-url');
    return Array.from(inputs).map(i => i.value).filter(u => u.trim() !== '');
}

// --- IMAGE PROCESSING (CANVAS) ---
window.handleImageProcessing = (input, targetId, callback = null) => {
    const file = input.files[0];
    if (!file) return;

    // Validar formato
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Formato no permitido. Usa JPG, PNG o WEBP.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            const needsProcessing = img.width > 1200 || img.height > 1200 || file.size > 15 * 1024 * 1024;
            
            if (needsProcessing) {
                const proceed = await showImageConfirmModal(file.size, img.width, img.height);
                if (proceed) {
                    const optimizedBase64 = processImage(img);
                    if (callback) callback(optimizedBase64);
                    else document.getElementById(targetId).value = optimizedBase64;
                    alert('Imagen optimizada correctamente.');
                }
            } else {
                if (callback) callback(e.target.result);
                else document.getElementById(targetId).value = e.target.result;
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

function showImageConfirmModal(size, w, h) {
    return new Promise((resolve) => {
        const modal = document.getElementById('image-confirm-modal');
        modal.style.display = 'flex';
        document.getElementById('orig-size').textContent = `${(size / 1024 / 1024).toFixed(2)}MB (${w}x${h})`;
        document.getElementById('opt-size').textContent = `~0.8MB (1200x1200)`;
        currentImageResolve = resolve;
    });
}

window.resolveImageProcess = (val) => {
    document.getElementById('image-confirm-modal').style.display = 'none';
    if (currentImageResolve) currentImageResolve(val);
};

function processImage(img) {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // Redimensionar manteniendo aspecto
    if (width > height) {
        if (width > 1200) {
            height *= 1200 / width;
            width = 1200;
        }
    } else {
        if (height > 1200) {
            width *= 1200 / height;
            height = 1200;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Exportar como WEBP con calidad 0.8 para ahorrar espacio
    return canvas.toDataURL('image/webp', 0.8);
}

// --- VARIANTS EDITOR ---
window.addNewVariant = () => {
    const container = document.getElementById('variants-editor-container');
    const vId = Date.now();
    const html = `
        <div class="variant-item" id="variant-${vId}">
            <span class="remove-variant" onclick="removeVariant('${vId}')">×</span>
            
            <div class="variant-grid">
                <div class="form-group">
                    <label>Color</label>
                    <input type="text" class="v-color" placeholder="Ej: Rojo F1">
                </div>
                <div class="form-group">
                    <label>Stock</label>
                    <input type="number" class="v-stock" placeholder="0">
                </div>
            </div>

            <div class="variant-image-section">
                <!-- Variant Main Image -->
                <div class="form-group">
                    <label style="font-size: 0.8rem;">Foto Principal Color</label>
                    <div class="small-upload-zone" id="v-main-zone-${vId}" onclick="document.getElementById('v-file-main-${vId}').click()">
                        <span class="v-icon-${vId}">📸</span>
                        <img id="v-preview-main-${vId}" class="small-preview">
                        <input type="file" id="v-file-main-${vId}" accept="image/*" style="display:none;" 
                               onchange="handleVariantImage(this, '${vId}', 'main')">
                    </div>
                    <input type="hidden" class="v-image-main">
                </div>

                <!-- Variant Gallery -->
                <div class="form-group">
                    <label style="font-size: 0.8rem;">Galería Color</label>
                    <div class="small-upload-zone" id="v-gal-zone-${vId}" onclick="document.getElementById('v-file-gal-${vId}').click()">
                        <span>➕</span>
                        <div id="v-preview-gal-${vId}" style="display:flex; gap:2px; flex-wrap:wrap; justify-content:center;"></div>
                        <input type="file" id="v-file-gal-${vId}" accept="image/*" style="display:none;" 
                               onchange="handleVariantImage(this, '${vId}', 'gallery')">
                    </div>
                    <input type="hidden" class="v-image-gallery">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    
    // Setup Dropzones for this new variant
    setupDropzone(`v-main-zone-${vId}`, (file) => {
        handleVariantImage({ files: [file] }, vId, 'main');
    });
    setupDropzone(`v-gal-zone-${vId}`, (file) => {
        handleVariantImage({ files: [file] }, vId, 'gallery');
    });
};

window.handleVariantImage = (input, vId, type) => {
    handleImageProcessing(input, '', (url) => {
        const variantEl = document.getElementById(`variant-${vId}`);
        if (type === 'main') {
            variantEl.querySelector('.v-image-main').value = url;
            const preview = document.getElementById(`v-preview-main-${vId}`);
            preview.src = url;
            preview.style.display = 'block';
            variantEl.querySelector(`.v-icon-${vId}`).style.display = 'none';
        } else {
            const galInput = variantEl.querySelector('.v-image-gallery');
            let current = galInput.value ? galInput.value.split(',').filter(u => u.trim() !== '') : [];
            current.push(url);
            galInput.value = current.join(',');
            
            // Render small gallery preview
            const galPreview = document.getElementById(`v-preview-gal-${vId}`);
            galPreview.innerHTML += `
                <img src="${url}" style="width:25px; height:25px; object-fit:cover; border-radius:2px;">
            `;
        }
    });
};

window.removeVariant = (id) => {
    document.getElementById(`variant-${id}`).remove();
};

function getVariantsFromEditor() {
    const items = document.querySelectorAll('.variant-item');
    const variants = [];
    items.forEach(item => {
        const color = item.querySelector('.v-color').value;
        const stock = item.querySelector('.v-stock').value;
        const image = item.querySelector('.v-image-main').value;
        const gallery = item.querySelector('.v-image-gallery').value.split(',').filter(u => u.trim() !== '');
        
        if (color) {
            variants.push({ 
                color, 
                stock: parseInt(stock) || 0, 
                image: image || '', 
                gallery: gallery || [] 
            });
        }
    });
    return variants;
}

function setVariantsToEditor(variants) {
    const container = document.getElementById('variants-editor-container');
    container.innerHTML = '';
    if (!variants || !Array.isArray(variants)) return;

    variants.forEach((v, idx) => {
        const vId = `v-exist-${idx}`;
        const html = `
            <div class="variant-item" id="variant-${vId}">
                <span class="remove-variant" onclick="removeVariant('${vId}')">×</span>
                
                <div class="variant-grid">
                    <div class="form-group">
                        <label>Color</label>
                        <input type="text" class="v-color" value="${v.color || ''}" placeholder="Ej: Rojo F1">
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" class="v-stock" value="${v.stock || 0}" placeholder="0">
                    </div>
                </div>

                <div class="variant-image-section">
                    <div class="form-group">
                        <label style="font-size: 0.8rem;">Foto Principal Color</label>
                        <div class="small-upload-zone" id="v-main-zone-${vId}" onclick="document.getElementById('v-file-main-${vId}').click()">
                            <span class="v-icon-${vId}" style="${v.image ? 'display:none' : ''}">📸</span>
                            <img id="v-preview-main-${vId}" src="${v.image || ''}" class="small-preview" style="${v.image ? 'display:block' : ''}">
                            <input type="file" id="v-file-main-${vId}" accept="image/*" style="display:none;" 
                                   onchange="handleVariantImage(this, '${vId}', 'main')">
                        </div>
                        <input type="hidden" class="v-image-main" value="${v.image || ''}">
                    </div>

                    <div class="form-group">
                        <label style="font-size: 0.8rem;">Galería Color</label>
                        <div class="small-upload-zone" id="v-gal-zone-${vId}" onclick="document.getElementById('v-file-gal-${vId}').click()">
                            <span>➕</span>
                            <div id="v-preview-gal-${vId}" style="display:flex; gap:2px; flex-wrap:wrap; justify-content:center;">
                                ${(v.gallery || []).map(img => `<img src="${img}" style="width:25px; height:25px; object-fit:cover; border-radius:2px;">`).join('')}
                            </div>
                            <input type="file" id="v-file-gal-${vId}" accept="image/*" style="display:none;" 
                                   onchange="handleVariantImage(this, '${vId}', 'gallery')">
                        </div>
                        <input type="hidden" class="v-image-gallery" value="${(v.gallery || []).join(',')}">
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        
        // Setup dropzones for existing
        setupDropzone(`v-main-zone-${vId}`, (file) => handleVariantImage({ files: [file] }, vId, 'main'));
        setupDropzone(`v-gal-zone-${vId}`, (file) => handleVariantImage({ files: [file] }, vId, 'gallery'));
    });
}

function switchModalTab(tabId) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// --- MODAL HELPERS ---
function openModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;

// --- SAVING PRODUCT ---
function setupProductEventListeners() {
    // Add Product Button
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            console.log('Abriendo modal de nuevo producto...');
            document.getElementById('modal-title').textContent = 'Nuevo Producto';
            
            const form = document.getElementById('product-form');
            if (form) form.reset();

            const editId = document.getElementById('edit-id');
            if (editId) editId.value = '';

            const badge = document.getElementById('p-badge');
            if (badge) badge.value = '';

            const shipping = document.getElementById('p-free-shipping');
            if (shipping) shipping.checked = false;
            
            // Reset Gallery Zones
            const galleryContainer = document.getElementById('gallery-zones-container');
            if (galleryContainer) {
                galleryContainer.innerHTML = '';
                if (typeof window.addGalleryUploadZone === 'function') {
                    window.addGalleryUploadZone(); 
                }
            }
            
            // Reset category
            const categorySelect = document.getElementById('p-category');
            if (categorySelect) categorySelect.value = 'juguetes';
            
            const categoryCustom = document.getElementById('p-category-custom');
            if (categoryCustom) {
                categoryCustom.style.display = 'none';
                categoryCustom.value = '';
            }

            // Reset image previews
            if (typeof window.updateMainPreview === 'function') {
                window.updateMainPreview('');
            }
            
            const urlContainer = document.getElementById('main-url-container');
            if (urlContainer) urlContainer.style.display = 'none';

            const variantContainer = document.getElementById('variants-editor-container');
            if (variantContainer) variantContainer.innerHTML = '';

            switchModalTab('tab-general');
            openModal();
        });
    }

    // Drag & Drop Listeners
    setupDropzone('main-image-dropzone', (file) => {
        const dummyInput = { files: [file] };
        handleImageProcessing(dummyInput, 'p-image', updateMainPreview);
    });

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.modal-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchModalTab(tabId);
        });
    });

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            
            const categorySelect = document.getElementById('p-category').value;
            const categoryCustom = document.getElementById('p-category-custom').value;
            const finalCategory = categorySelect === 'otro' ? categoryCustom : categorySelect;

            const productData = {
                name: document.getElementById('p-name').value,
                category: finalCategory,
                price: parseFloat(document.getElementById('p-price').value),
                image: document.getElementById('p-image').value,
                stock: parseInt(document.getElementById('p-stock').value),
                sku: document.getElementById('p-sku').value,
                brand: document.getElementById('p-brand').value,
                description: document.getElementById('p-desc').value,
                specifications: document.getElementById('p-specs').value,
                materials: document.getElementById('p-materials').value,
                technical_details: document.getElementById('p-tech').value,
                status: document.getElementById('p-status') ? document.getElementById('p-status').value : 'active',
                badge: document.getElementById('p-badge').value,
                tags: document.getElementById('p-tags').value.split(',').map(t => t.trim()).filter(t => t !== ''),
                gallery: getGalleryFromZones(),
                variants: getVariantsFromEditor(),
                shipping_info: {
                    free_shipping: document.getElementById('p-free-shipping').checked,
                    cost: 0
                }
            };

            try {
                if (id) {
                    const { error } = await supabaseClient.from('products').update(productData).eq('id', id);
                    if (error) throw error;
                    alert('Producto actualizado con éxito.');
                } else {
                    const { error } = await supabaseClient.from('products').insert([productData]);
                    if (error) throw error;
                    alert('¡Producto creado con éxito!');
                }
                closeModal();
                await loadAdminProducts();
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('Error al guardar: ' + (error.message || 'Error desconocido'));
            }
        });
    }

    // Search functionality
    const searchInput = document.getElementById('admin-product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#product-table-body tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

window.editProduct = (id) => {
    const p = adminProducts.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('edit-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    
    // Category logic
    const categorySelect = document.getElementById('p-category');
    const categoryCustom = document.getElementById('p-category-custom');
    const standardCategories = ['juguetes', 'muebles', 'hogar', 'logistica'];
    
    if (standardCategories.includes(p.category)) {
        categorySelect.value = p.category;
        categoryCustom.style.display = 'none';
    } else {
        categorySelect.value = 'otro';
        categoryCustom.value = p.category;
        categoryCustom.style.display = 'block';
    }

    document.getElementById('p-price').value = p.price;
    updateMainPreview(p.image);
    document.getElementById('p-image').value = p.image;
    document.getElementById('p-sku').value = p.sku || '';
    document.getElementById('p-brand').value = p.brand || '';
    document.getElementById('p-stock').value = p.stock || 0;
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-specs').value = p.specifications || '';
    document.getElementById('p-materials').value = p.materials || '';
    document.getElementById('p-tech').value = p.technical_details || '';
    
    if (document.getElementById('p-status')) {
        document.getElementById('p-status').value = p.status || 'active';
    }

    document.getElementById('p-badge').value = p.badge || '';
    document.getElementById('p-tags').value = (p.tags || []).join(', ');
    
    // Load Gallery Zones
    document.getElementById('gallery-zones-container').innerHTML = '';
    if (p.gallery && Array.isArray(p.gallery)) {
        p.gallery.forEach(url => addGalleryUploadZone(url));
    }
    
    // Shipping info
    const shipping = p.shipping_info || { free_shipping: false };
    document.getElementById('p-free-shipping').checked = !!shipping.free_shipping;

    setVariantsToEditor(p.variants);
    switchModalTab('tab-general');
    openModal();
};

window.updateProductStatus = async (id, newStatus) => {
    try {
        const { error } = await supabaseClient.from('products').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        await loadAdminProducts();
    } catch (error) {
        console.error('Error actualizando estado:', error);
    }
};

// --- STATS & CHARTS ---
async function loadDashboardStats() {
    try {
        const { data: orders, error: ordersError } = await supabaseClient.from('orders').select('total, status, created_at');
        if (ordersError) throw ordersError;

        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

        document.getElementById('stat-sales').textContent = `$${totalRevenue.toLocaleString('es-MX')}`;
        document.getElementById('stat-pending').textContent = pendingOrders;
        document.getElementById('stat-avg').textContent = `$${avgTicket.toLocaleString('es-MX')}`;

        const { data: products, error: productsError } = await supabaseClient.from('products').select('name, stock, sku').neq('status', 'deleted');
        if (productsError) throw productsError;

        const lowStockItems = products.filter(p => p.stock <= 5);
        document.getElementById('stat-low-stock').textContent = lowStockItems.length;
        renderLowStockAlerts(lowStockItems);
        renderSalesChart(orders);
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function renderLowStockAlerts(items) {
    const list = document.getElementById('low-stock-list');
    if (!list) return;
    list.innerHTML = items.length === 0 ? '<li>✓ Inventario saludable</li>' : 
        items.map(item => `
            <li style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                <span>${item.name}</span>
                <span class="stock-alert-badge">${item.stock} en stock</span>
            </li>
        `).join('');
}

function renderSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }));
        const dayTotal = orders.filter(o => new Date(o.created_at).toDateString() === date.toDateString()).reduce((sum, o) => sum + (o.total || 0), 0);
        data.push(dayTotal);
    }
    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{ label: 'Ventas ($)', data, borderColor: '#c62828', backgroundColor: 'rgba(198, 40, 40, 0.1)', fill: true, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// --- MARKETING & BLOG --- (Keep existing functions but simplified for space)
async function loadMarketingItems() {
    try {
        const { data, error } = await supabaseClient.from('marketing').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const tableBody = document.getElementById('marketing-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = data.map(item => `
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
    } catch (e) { console.error(e); }
}

async function loadOrders() {
    try {
        const { data, error } = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const container = document.getElementById('orders-table-body');
        if (!container) return;
        container.innerHTML = data.map(ord => `
            <tr>
                <td>#${ord.id}</td>
                <td>${ord.customer_name}</td>
                <td>$${parseFloat(ord.total).toLocaleString('es-MX')}</td>
                <td><span style="color: ${getStatusColor(ord.status)}; font-weight: 600;">${ord.status.toUpperCase()}</span></td>
                <td>${new Date(ord.created_at).toLocaleDateString()}</td>
                <td><button class="btn btn-edit">Detalles</button></td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

function getStatusColor(status) {
    const colors = { pending: 'orange', paid: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red' };
    return colors[status] || 'black';
}

function initDashboardAnimations() {
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.opacity = '1';
                el.style.transform = 'translate3d(0, 0, 0)';
                el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                observer.unobserve(el);
            }
        });
    }, options);

    document.querySelectorAll('[data-animate]').forEach(el => {
        const animation = el.getAttribute('data-animate');
        el.style.opacity = '0';
        el.style.willChange = 'transform, opacity';

        if (animation === 'fade-up') el.style.transform = 'translate3d(0, 30px, 0)';
        if (animation === 'fade-right') el.style.transform = 'translate3d(-30px, 0, 0)';
        if (animation === 'fade-left') el.style.transform = 'translate3d(30px, 0, 0)';

        observer.observe(el);
    });
}
