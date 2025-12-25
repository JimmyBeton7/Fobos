import type { AccountRow, CategoryRow, TransactionRow } from '../../Electron/types'
import { supabase } from './supabaseClient'

export type AccountsApi = {
  list: () => Promise<AccountRow[]>
  upsert: (d: {
    id?: string
    name: string
    colorHex: string
    description?: string
    currentAmount: number
  }) => Promise<{ ok: boolean; id: string }>
  delete: (id: string) => Promise<{ ok: boolean }>
}

export type CategoriesApi = {
  list: () => Promise<CategoryRow[]>
  upsert: (d: { id?: string; name: string; colorHex?: string | null }) => Promise<{ ok: boolean; id: string }>
  delete: (id: string) => Promise<{ ok: boolean }>
}

export type TransactionsApi = {
  listAll: () => Promise<TransactionRow[]>
  listByAccount: (accountId: string) => Promise<TransactionRow[]>
  upsert: (d: {
    id?: string
    accountId: string
    kind: 'income' | 'expense'
    ownCategoryId?: string | null
    amountCents: number
    date: string
    title: string
    note?: string
  }) => Promise<{ ok: boolean; id: string }>
  delete: (id: string) => Promise<{ ok: boolean }>
}

export type Api = {
  accounts: AccountsApi
  categories: CategoriesApi
  transactions: TransactionsApi
}

//======== ACCOUNTS ==============================
const accountsApi: AccountsApi = {
  async list() {
    const { data, error } = await supabase
      .from('account')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as AccountRow[]
  },

  async upsert(d) {
    const now = new Date().toISOString()
    const id = d.id ?? crypto.randomUUID()
    const cents = Math.round(d.currentAmount * 100)

    const { data: prev, error: getErr } = await supabase
      .from('account')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (getErr && (getErr as any).code !== 'PGRST116') {
      throw getErr
    }

    let balance_changed_manually: string | null = prev?.balance_changed_manually ?? null

    if (!prev) {
      balance_changed_manually = now
    } else if (prev.current_amount_cents !== cents) {
      balance_changed_manually = now
    }

    const row: AccountRow = {
      id,
      name: d.name.trim(),
      color_hex: d.colorHex,
      description: d.description?.trim() ?? null,
      current_amount_cents: cents,
      balance_changed_manually,
      created_at: prev?.created_at ?? now,
      updated_at: now,
    }

    const { error: upsertErr } = await supabase
      .from('account')
      .upsert(row, { onConflict: 'id' })

    if (upsertErr) throw upsertErr

    return { ok: true, id }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('account')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { ok: true }
  },
}

//====== CATEGORIES =====================
const categoriesApi: CategoriesApi = {
  async list() {
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as CategoryRow[]
  },

  async upsert(p) {
    const now = new Date().toISOString()
    const id = p.id ?? crypto.randomUUID()

    const { data: existing, error: getErr } = await supabase
      .from('category')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (getErr && (getErr as any).code !== 'PGRST116') {
      throw getErr
    }

    const row: CategoryRow = {
      id,
      name: p.name.trim(),
      color_hex: p.colorHex ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    }

    const { error: upsertErr } = await supabase
      .from('category')
      .upsert(row, { onConflict: 'id' })

    if (upsertErr) throw upsertErr

    return { ok: true, id }
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('category')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { ok: true }
  },
}

//========== TRANSACTIONS ===========
const transactionsApi: TransactionsApi = {
  async listAll() {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as TransactionRow[]
  },

  async listByAccount(accountId: string) {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as TransactionRow[]
  },

  async upsert(d) {
    const now = new Date().toISOString()
    const isNew = !d.id
    const id = d.id ?? crypto.randomUUID()

    let deltaDiff = 0
    let prevTx: TransactionRow | null = null

    if (isNew) {
      deltaDiff = d.kind === 'income' ? d.amountCents : -d.amountCents
    } else {
      const { data: prev, error: prevErr } = await supabase
        .from('transaction')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (prevErr) throw prevErr
      if (!prev) throw new Error('Transaction not found')

      prevTx = prev as TransactionRow

      const prevSigned = prevTx.kind === 'income' ? prevTx.amount_cents : -prevTx.amount_cents
      const newSigned = d.kind === 'income' ? d.amountCents : -d.amountCents
      deltaDiff = newSigned - prevSigned
    }

    const txRow: TransactionRow = {
      id,
      account_id: d.accountId,
      kind: d.kind,
      own_category_id: d.ownCategoryId ?? null,
      amount_cents: d.amountCents,
      date: d.date,
      title: d.title,
      note: d.note ?? null,
      created_at: prevTx?.created_at ?? now,
      updated_at: now,
    }

    const { error: upsertTxErr } = await supabase
      .from('transaction')
      .upsert(txRow, { onConflict: 'id' })

    if (upsertTxErr) throw upsertTxErr

    if (deltaDiff !== 0) {
      const { data: acc, error: accErr } = await supabase
        .from('account')
        .select('*')
        .eq('id', d.accountId)
        .maybeSingle()

      if (accErr) throw accErr
      if (!acc) throw new Error('Account not found for transaction')

      const accRow = acc as AccountRow
      const newBalance = accRow.current_amount_cents + deltaDiff

      const txDate = d.date
      const prevBCM = accRow.balance_changed_manually
      const shouldBcmBeTxDate =
        !prevBCM || new Date(prevBCM) < new Date(txDate)

      const { error: updAccErr } = await supabase
        .from('account')
        .update({
          current_amount_cents: newBalance,
          balance_changed_manually: shouldBcmBeTxDate ? txDate : prevBCM,
          updated_at: now,
        })
        .eq('id', d.accountId)

      if (updAccErr) throw updAccErr
    }

    return { ok: true, id }
  },

  async delete(id: string) {
    const now = new Date().toISOString()

    const { data: prev, error: prevErr } = await supabase
      .from('transaction')
      .select('account_id, kind, amount_cents, date')
      .eq('id', id)
      .maybeSingle()

    if (prevErr) throw prevErr
    if (!prev) {
      return { ok: true }
    }

    const prevTx = prev as Pick<TransactionRow, 'account_id' | 'kind' | 'amount_cents' | 'date'>

    const signed = prevTx.kind === 'income' ? prevTx.amount_cents : -prevTx.amount_cents
    const deltaUndo = -signed

    const { error: delErr } = await supabase
      .from('transaction')
      .delete()
      .eq('id', id)

    if (delErr) throw delErr

    const { data: acc, error: accErr } = await supabase
      .from('account')
      .select('*')
      .eq('id', prevTx.account_id)
      .maybeSingle()

    if (accErr) throw accErr
    if (!acc) return { ok: true }

    const accRow = acc as AccountRow
    const newBalance = accRow.current_amount_cents + deltaUndo

    const { error: updAccErr } = await supabase
      .from('account')
      .update({
        current_amount_cents: newBalance,
        updated_at: now,
      })
      .eq('id', prevTx.account_id)

    if (updAccErr) throw updAccErr

    return { ok: true }
  },
}

export const api: Api = {
  accounts: accountsApi,
  categories: categoriesApi,
  transactions: transactionsApi,
}
