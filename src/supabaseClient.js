import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project')) {
  console.warn('⚠️ Supabase URL / Anon Key belum dikonfigurasi di file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


