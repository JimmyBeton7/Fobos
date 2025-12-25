export type Currency = 'PLN' | 'EUR' | 'USD'

export interface Account {
  id: string
  name: string
  colorHex: string
  description?: string
  currency: Currency
  createdAt: string
  updatedAt: string
}

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  amountCents: number
  date: string
  title: string
  note?: string
  createdAt: string
  updatedAt: string
}

export const nowIso = () => new Date().toISOString()
