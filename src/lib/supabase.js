import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Gunakan 'implicit' flow untuk bypass kebutuhan PKCE (window.crypto.subtle).
    // Ini memperbaiki masalah gagal login di iOS/Tablet saat test via IP lokal HTTP.
    flowType: 'implicit',
  }
})
