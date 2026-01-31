import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setStatusListener } from 'DataApi'
import type { AccountRow, CategoryRow, TransactionRow, OperationStatus } from '../../../Electron/types'

type DataContextValue = {
  accounts: AccountRow[]
  categories: CategoryRow[]
  transactions: TransactionRow[]
  reloadAccounts: () => Promise<void>
  reloadCategories: () => Promise<void>
  reloadTransactions: () => Promise<void>
  reloadAll: () => Promise<void>

  loading: {
    accounts: boolean,
    transactions: boolean,
    categories: boolean,
    reports: boolean
  }

  lastStatus: OperationStatus | null
  clearLastStatus: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])

  const [loading, setLoading] = useState({
    accounts: false,
    categories: false,
    transactions: false,
    reports: false
  })

  const [lastStatus, setLastStatus] = useState<OperationStatus | null>(null)
  const clearLastStatus = () => setLastStatus(null)

  useEffect(() => {
    setStatusListener((s) => setLastStatus(s))
    return () => setStatusListener(null)
  }, [])

  const reloadAccounts = async () => {
    setLoading(s => ({ ...s, accounts: true }))
    try {
      const data = await api.accounts.list()
      setAccounts(data)
    } catch (err) {
      console.error('Failed to reload accounts', err)
    }
  }

  const reloadCategories = async () => {
    setLoading(s => ({ ...s, categories: true }))
    try {
      const data = await api.categories.list()
      setCategories(data)
    } catch (err) {
      console.error('Failed to reload categories', err)
    }
  }

  const reloadTransactions = async () => {
    setLoading(s => ({ ...s, transactions: true }))
    try {
      const data = await api.transactions.listAll()
      setTransactions(data)
    } catch (err) {
      console.error('Failed to reload transactions', err)
    } finally {
      setLoading(s => ({ ...s, transactions: false }))
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
    loading,
    lastStatus,
    clearLastStatus
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
