export type AccountRow = {
  id: string
  name: string
  color_hex: string
  description: string | null
  current_amount_cents: number
  created_at: string
  updated_at: string
  balance_changed_manually: string | null
}

export type CategoryRow = {
  id: string
  name: string
  color_hex: string | null
  created_at: string
  updated_at: string
}

export type TransactionRow = {
  id: string
  account_id: string
  kind: 'income' | 'expense'
  own_category_id: string | null
  amount_cents: number
  date: string
  title: string
  note: string | null
  created_at: string
  updated_at: string
}
