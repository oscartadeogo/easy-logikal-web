/**
 * CORRECCIONES NECESARIAS EN main.js
 * 
 * Cambios críticos a realizar:
 * 1. Líneas 15-19: Cambiar filtro de status
 * 2. Línea 55+: Reemplazar referencias a supabaseClient
 * 3. Agregar función getSupabaseClient()
 */

// ========================================================================
// CORRECCIÓN #1: Reemplazar la función loadProducts completa
// ========================================================================
// 
// ❌ ANTES (línea ~15):
// 
// async function loadProducts() {
//     const homeFeatured = document.getElementById('home-featured-products');
//     if (!productContainer && !homeFeatured) return;
//     
//     try {
//         console.log('Cargando productos desde Supabase...');
//         const { data, error } = await supabaseClient
//             .from('products')
//             .select('*')
//             .neq('status', 'deleted')  // ❌ PROBLEMA: Carga pausados también
//             .order('created_at', { ascending: false });
//
// ✅ DESPUÉS (corregido):

async function loadProducts() {
    const homeFeatured = document.getElementById('home-featured-products');
    if (!productContainer && !homeFeatured) return;
    
    try {
        console.log('✅ Cargando productos desde Supabase...');
        
        // ✅ Usar función helper segura
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase no conectado');
        
        // ✅ CORREGIDO: .eq('status', 'active') en lugar de .neq('status', 'deleted')
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')  // ✅ Ahora solo carga ACTIVOS
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log(`✅ ${data?.length || 0} productos cargados exitosamente`);
        allProducts = data || [];
        
        // Actualizar categorías dinámicas si estamos en la página de productos
        if (document.getElementById('category-filters')) {
            renderDynamicCategories();
        }

        if (productContainer) {
            applyAllFilters();
        }
        
        if (homeFeatured) {
            // En home: mostrar solo los 4 primeros activos
            renderFeatured(allProducts.slice(0, 4), homeFeatured);
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        if (productContainer) {
            productContainer.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">Error al conectar con la base de datos: ${error.message}</p>
                    <button class="btn btn-primary btn-sm" onclick="location.reload()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2-8.12"></path>
                        </svg>
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// ========================================================================
// CORRECCIÓN #2: Reemplazar función loadHomeFeatured
// ========================================================================
//
// ✅ DESPUÉS (corregido):

async function loadHomeFeatured() {
    const featuredContainer = document.getElementById('home-featured-products');
    if (!featuredContainer) return;

    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase no conectado');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')  // ✅ Solo activos
            .limit(4);

        if (error) throw error;
        renderFeatured(data || [], featuredContainer);
    } catch (error) {
        console.warn('⚠️ Error cargando destacados:', error);
        // Fallback silencioso
    }
}

// ========================================================================
// CORRECCIÓN #3: Reemplazar todas las referencias a supabaseClient
// ========================================================================
//
// Buscar y reemplazar en todo el archivo:
// 
// ❌ supabaseClient
// ✅ getSupabaseClient()
//
// Ejemplos:

// ❌ ANTES:
// await supabaseClient.from('contacts').insert(...)

// ✅ DESPUÉS:
// const supabase = getSupabaseClient();
// await supabase.from('contacts').insert(...)

// En el método injectQuoteModal, cambiar:
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
                    const supabase = getSupabaseClient();  // ✅ CORREGIDO
                    const { error } = await supabase
                        .from('contacts')
                        .insert([{
                            name: document.getElementById('q-name').value,
                            email: 'quote@quick.form',
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

// ========================================================================
// RESUMEN DE CAMBIOS
// ========================================================================
//
// 1. ✅ Cambiar línea ~18: .neq('status', 'deleted') → .eq('status', 'active')
// 2. ✅ Cambiar línea ~55: supabaseClient → getSupabaseClient()
// 3. ✅ Cambiar línea ~230: supabaseClient → getSupabaseClient()
// 4. ✅ Cambiar línea ~273: supabaseClient → getSupabaseClient()
// 5. ✅ Agregar error handling con try/catch
// 6. ✅ Agregar validación de supabase
//
// Por favor, ejecute find & replace en el archivo main.js original:
// Find:    supabaseClient
// Replace: getSupabaseClient()
//
// Y cambiar:
// Find:    .neq('status', 'deleted')
// Replace: .eq('status', 'active')
