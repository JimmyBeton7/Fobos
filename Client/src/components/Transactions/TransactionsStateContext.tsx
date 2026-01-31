import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type TransactionsState = {
  dateFrom: Date | null
  setDateFrom: (v: Date | null) => void
  dateTo: Date | null
  setDateTo: (v: Date | null) => void
  initialized: boolean
  setInitialized: (v: boolean) => void
}

const TransactionsStateContext = createContext<TransactionsState | undefined>(undefined)

export function TransactionsStateProvider({ children }: { children: ReactNode }) {
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [initialized, setInitialized] = useState(false)

  const value = useMemo(
    () => ({
      dateFrom,
      setDateFrom,
      dateTo,
      setDateTo,
      initialized,
      setInitialized,
    }),
    [dateFrom, dateTo, initialized]
  )

  return (
    <TransactionsStateContext.Provider value={value}>
      {children}
    </TransactionsStateContext.Provider>
  )
}

export function useTransactionsState() {
  const ctx = useContext(TransactionsStateContext)
  if (!ctx) throw new Error("useTransactionsState must be used within TransactionsStateProvider")
  return ctx
}
