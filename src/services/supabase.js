import { createClient } from '@supabase/supabase-js';

// Khóa lưu cấu hình Supabase tùy chỉnh trong LocalStorage nếu người dùng nhập trực tiếp trên giao diện
const SUPABASE_CONFIG_KEY = 'finflow_supabase_config_v1';

// Lấy thông tin URL & Key từ biến môi trường .env hoặc từ LocalStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  try {
    const customConfig = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, source: 'local' };
      }
    }
  } catch (err) {
    console.error('Lỗi đọc cấu hình Supabase từ LocalStorage:', err);
  }

  return { url: '', anonKey: '', source: 'none' };
}

// Lưu cấu hình Supabase tùy chỉnh
export function saveSupabaseCredentials(url, anonKey) {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
    // Tạo lại client
    initSupabaseClient();
    return true;
  } catch (err) {
    console.error('Lỗi khi lưu cấu hình Supabase:', err);
    return false;
  }
}

// Xóa cấu hình Supabase tùy chỉnh
export function clearSupabaseCredentials() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  supabaseClient = null;
}

let supabaseClient = null;

// Khởi tạo Supabase Client
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const creds = getSupabaseCredentials();
  if (creds.url && creds.anonKey) {
    try {
      supabaseClient = createClient(creds.url, creds.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseClient;
    } catch (err) {
      console.error('Lỗi khởi tạo Supabase Client:', err);
      return null;
    }
  }
  return null;
}

function initSupabaseClient() {
  supabaseClient = null;
  return getSupabaseClient();
}

// Kiểm tra xem Supabase đã được cấu hình chưa
export function isSupabaseConfigured() {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.anonKey);
}

// -------------------------------------------------------------
// Các hàm tương tác Authentication
// -------------------------------------------------------------

export async function signUp(email, password) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa cấu hình Supabase URL & Anon Key');
  return await client.auth.signUp({
    email,
    password
  });
}

export async function signIn(email, password) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa cấu hình Supabase URL & Anon Key');
  return await client.auth.signInWithPassword({
    email,
    password
  });
}

export async function resendConfirmationEmail(email) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa cấu hình Supabase URL & Anon Key');
  return await client.auth.resend({
    type: 'signup',
    email
  });
}

export async function signOut() {
  const client = getSupabaseClient();
  if (!client) return;
  return await client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data: { session } } = await client.auth.getSession();
  return session ? session.user : null;
}

export function subscribeToAuth(callback) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(session ? session.user : null);
  });

  return () => {
    subscription?.unsubscribe();
  };
}

// -------------------------------------------------------------
// Các hàm tương tác Cloud Database (Đồng bộ dữ liệu)
// -------------------------------------------------------------

const TABLE_NAME = 'user_financial_data';

// Tải dữ liệu người dùng từ Cloud Database
export async function fetchCloudData(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('data, updated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: Không tìm thấy dòng nào (người dùng mới)
      console.warn('Lỗi khi đọc dữ liệu từ Supabase:', error);
      return null;
    }

    return data ? data.data : null;
  } catch (err) {
    console.error('Lỗi kết nối Supabase fetchCloudData:', err);
    return null;
  }
}

// Lưu / Đồng bộ dữ liệu người dùng lên Cloud Database
export async function syncCloudData(userId, finData) {
  const client = getSupabaseClient();
  if (!client || !userId) return false;

  try {
    const { error } = await client
      .from(TABLE_NAME)
      .upsert({
        user_id: userId,
        data: finData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Lỗi khi ghi dữ liệu lên Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Lỗi kết nối Supabase syncCloudData:', err);
    return false;
  }
}
