import { createClient } from '@supabase/supabase-js'
import type { AccountRow, CategoryRow, TransactionRow } from '../../Electron/types'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export type SupabaseAccountRow = AccountRow
export type SupabaseCategoryRow = CategoryRow
export type SupabaseTransactionRow = TransactionRow

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})
