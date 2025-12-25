import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api'
import type { AccountRow, CategoryRow, TransactionRow } from '../../../Electron/types'

type DataContextValue = {
  accounts: AccountRow[]
  categories: CategoryRow[]
  transactions: TransactionRow[]
  reloadAccounts: () => Promise<void>
  reloadCategories: () => Promise<void>
  reloadTransactions: () => Promise<void>
  reloadAll: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])

  const reloadAccounts = async () => {
    try {
      const data = await api.accounts.list()
      setAccounts(data)
    } catch (err) {
      console.error('Failed to reload accounts', err)
    }
  }

  const reloadCategories = async () => {
    try {
      const data = await api.categories.list()
      setCategories(data)
    } catch (err) {
      console.error('Failed to reload categories', err)
    }
  }

  const reloadTransactions = async () => {
    try {
      const data = await api.transactions.listAll()
      setTransactions(data)
    } catch (err) {
      console.error('Failed to reload transactions', err)
    }
  }

  const reloadAll = async () => {
    await Promise.all([
      reloadAccounts(),
      reloadCategories(),
      reloadTransactions(),
    ])
  }

  useEffect(() => {
    void reloadAll()
  }, [])

  const value: DataContextValue = {
    accounts,
    categories,
    transactions,
    reloadAccounts,
    reloadCategories,
    reloadTransactions,
    reloadAll,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('useData must be used within DataProvider')
  }
  return ctx
}
