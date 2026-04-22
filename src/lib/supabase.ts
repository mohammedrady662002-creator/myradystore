import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.log('🔗 Current URL:', supabaseUrl || 'MISSING');
  console.log('🔑 Current Key Status:', supabaseAnonKey ? 'DEFINED' : 'MISSING');
  console.warn('يرجى التأكد من إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في قسم Secrets بالحروف الكبيرة.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
