import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as credenciais foram configuradas e não são placeholders
export const hasSupabaseConfig = !!supabaseUrl && !!supabaseKey && !supabaseUrl.includes('cole_sua');

// Inicializa a conexão com o Supabase se a URL existir
export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : null;
