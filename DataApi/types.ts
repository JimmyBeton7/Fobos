import type { AccountRow, CategoryRow, TransactionRow } from "../Electron/types"

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
  importBatch: (d: ImportTransactionsBatchInput) => Promise<ImportTransactionsBatchResult>
}

export type ImportTransactionDraft = {
  tempId: string
  include: boolean
  date: string 
  title: string
  amountCents: number
  kind: 'income' | 'expense'
  currency: string
  bankCategory?: string | null
  ownCategoryId: string | null
}

export type ImportTransactionsBatchInput = {
  accountId: string
  items: Array<{
    kind: 'income' | 'expense'
    ownCategoryId: string
    amountCents: number
    date: string
    title: string
    note?: string
  }>
}

export type ImportTransactionsBatchResult = {
  ok: boolean
  count: number
}
