/**
 * Easy Logikal Comercialización - Supabase Client Configuration
 * INTEGRACIÓN REAL CON GITHUB PAGES
 */

// Configuración real de Supabase para Easy Logikal
const SUPABASE_URL = 'https://xvocbfonusnerczjhdzh.supabase.co'; 

const SUPABASE_ANON_KEY = 'sb_publishable_Bncn5FfPRPyRj8BDjjXOFQ_IRqFxsPZ';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch all products from real database
 */
async function fetchProducts() {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data;
}

/**
 * Handle Admin Login with Supabase Auth
 */
async function adminLogin(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) throw error;
    return data;
}

/**
 * Handle Admin Logout
 */
async function adminLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Error logging out:', error);
    window.location.href = 'index.html';
}

/**
 * Save new product to Supabase
 */
async function saveProduct(product) {
    const { data, error } = await supabaseClient
        .from('products')
        .upsert(product)
        .select();

    if (error) throw error;
    return data;
}

/**
 * Delete product from Supabase
 */
async function deleteProduct(productId) {
    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) throw error;
}
