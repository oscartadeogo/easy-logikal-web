/**
 * Easy Logikal Comercialización - Supabase Client Configuration
 * INTEGRACIÓN REAL CON GITHUB PAGES - VERSIÓN CORREGIDA
 * 
 * Cambios:
 * ✅ Inicialización diferida de supabaseClient
 * ✅ Función helper getSupabaseClient() para acceso seguro
 * ✅ Mejor manejo de errores
 */

// Configuración real de Supabase para Easy Logikal
const SUPABASE_URL = 'https://xvocbfonusnerczjhdzh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_Bncn5FfPRPyRj8BDjjXOFQ_IRqFxsPZ';

// Variable global para cliente Supabase
let supabaseClient = null;

/**
 * Obtener cliente Supabase (con inicialización lazy)
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        if (typeof supabase === 'undefined') {
            console.error('Supabase SDK no está cargado');
            return null;
        }
        
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            return null;
        }
    }
    
    return supabaseClient;
}

/**
 * Fetch all products from real database
 * Con filtros opcionales mejorados
 */
async function fetchProducts(filters = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        let query = supabase
            .from('products')
            .select('*')
            .eq('status', 'active');  // ✅ CORREGIDO: Solo productos activos

        // Aplicar filtros opcionales
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.inStockOnly) {
            query = query.gt('stock', 0);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
        }

        // Ordenar
        const orderBy = filters.sortBy || 'created_at';
        const ascending = filters.ascending !== false;
        query = query.order(orderBy, { ascending });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        console.log(`✅ ${data?.length || 0} productos cargados`);
        return data || [];
    } catch (error) {
        console.error('Error en fetchProducts:', error);
        throw error;
    }
}

/**
 * Fetch single product by ID
 */
async function fetchProductById(productId) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('status', 'active')
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        throw error;
    }
}

/**
 * Handle Admin Login with Supabase Auth - MEJORADO
 */
async function adminLogin(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Guardar sesión
        sessionStorage.setItem('admin_session', JSON.stringify({
            user: data.user,
            session: data.session,
            loginTime: new Date().toISOString()
        }));

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Verificar sesión admin activa
 */
async function verifyAdminSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            sessionStorage.removeItem('admin_session');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Session verification error:', error);
        return false;
    }
}

/**
 * Handle Admin Logout
 */
async function adminLogout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
        
        sessionStorage.removeItem('admin_session');
        localStorage.removeItem('easy_logikal_admin');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

/**
 * Save new product to Supabase - MEJORADO
 */
async function saveProduct(product) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        const isAdmin = await verifyAdminSession();
        if (!isAdmin) throw new Error('Admin authentication required');

        // Validación básica
        if (!product.name || !product.price) {
            throw new Error('Name and price are required');
        }

        const { data, error } = await supabase
            .from('products')
            .upsert({
                ...product,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;
        console.log('✅ Producto guardado:', data);
        return data;
    } catch (error) {
        console.error('Error saving product:', error);
        throw error;
    }
}

/**
 * Delete product from Supabase - SOFT DELETE
 */
async function deleteProduct(productId) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        const isAdmin = await verifyAdminSession();
        if (!isAdmin) throw new Error('Admin authentication required');

        // Soft delete: cambiar status a 'deleted'
        const { error } = await supabase
            .from('products')
            .update({ status: 'deleted', updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (error) throw error;
        console.log('✅ Producto eliminado (soft delete)');
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

/**
 * Subscribe to real-time product changes
 */
function subscribeToProducts(callback) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const subscription = supabase
        .channel('public:products')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'products' 
            }, 
            (payload) => {
                console.log('🔄 Cambio detectado en productos:', payload);
                if (typeof callback === 'function') {
                    callback(payload);
                }
            }
        )
        .subscribe((status) => {
            console.log(`📡 Channel subscription status: ${status}`);
        });

    return subscription;
}

/**
 * Fetch contacts (admin only)
 */
async function fetchContacts() {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        const isAdmin = await verifyAdminSession();
        if (!isAdmin) throw new Error('Admin authentication required');

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching contacts:', error);
        throw error;
    }
}

/**
 * Save contact form submission
 */
async function saveContact(contact) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client not available');

    try {
        // Validar datos
        if (!contact.name || !contact.email || !contact.message) {
            throw new Error('Name, email, and message are required');
        }

        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                ...contact,
                status: 'new'
            }])
            .select();

        if (error) throw error;
        console.log('✅ Contacto guardado');
        return data;
    } catch (error) {
        console.error('Error saving contact:', error);
        throw error;
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabaseClient,
        fetchProducts,
        fetchProductById,
        adminLogin,
        verifyAdminSession,
        adminLogout,
        saveProduct,
        deleteProduct,
        subscribeToProducts,
        fetchContacts,
        saveContact
    };
}
