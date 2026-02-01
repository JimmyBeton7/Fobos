import { createClient } from '@supabase/supabase-js'
import type { AccountRow, CategoryRow, TransactionRow } from '../Electron/types'
import { emitStatus } from './statusListener'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  const errMessage = 'Supabase URL or Anon key nnot found'
  emitStatus({
    scope: "config",
    action: "supabase_config",
    state: "error",
    message: errMessage,
  });
}

export type SupabaseAccountRow = AccountRow
export type SupabaseCategoryRow = CategoryRow
export type SupabaseTransactionRow = TransactionRow

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})
