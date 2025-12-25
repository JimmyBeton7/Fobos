import { useMemo, useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Calendar } from 'primereact/calendar'
import TransactionsTable from './TransactionsTable/TransactionsTable'
import TransactionsDialog from './TransactionsDialog/TransactionsDialog'
import type { TransactionRow } from '../../../../Electron/types'
import { api } from '../../api'
import { useData } from '../DataContext'
import './Transaction.styles.css'

export default function Transactions() {
  const {
    accounts,
    categories,
    transactions,
    reloadTransactions,
    reloadAccounts,
  } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<TransactionRow | null>(null)

  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create')

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map(a => [a.id, a])),
    [accounts]
  )
  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  )

  const onCreate = () => openDialog('create', null)
  const onEdit = (row: TransactionRow) => openDialog('edit', row)
  const onDuplicate = (row: TransactionRow) => openDialog('duplicate', row)

  const onDelete = (row: TransactionRow) => {
    confirmDialog({
      header: 'Confirm deletion',
      message: `Delete transaction "${row.title}"? This action cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      accept: async () => {
        await api.transactions.delete(row.id)
        await Promise.all([
          reloadTransactions(),
          reloadAccounts(),
        ])
      }
    })
  }

  const openDialog = (nextMode: 'create' | 'edit' | 'duplicate', row: TransactionRow | null) => {
    setMode(nextMode)
    setEditRow(row)
    setDialogOpen(true)
  }

  const onSubmit = async (d: {
    id?: string
    account_id: string
    kind: 'income' | 'expense'
    own_category_id?: string | null
    amount_cents: number
    date: string
    title: string
    note?: string | null
  }) => {
    const idForUpsert = mode === 'edit' ? d.id : undefined

    await api.transactions.upsert({
      id: idForUpsert,
      accountId: d.account_id,
      kind: d.kind,
      ownCategoryId: d.own_category_id ?? null,
      amountCents: d.amount_cents,
      date: d.date,
      title: d.title,
      note: d.note ?? undefined
    })

    await Promise.all([
      reloadTransactions(),
      reloadAccounts(),
    ])

    setDialogOpen(false)
    setEditRow(null)
    setMode('create')
  }

  const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
  const endOfDay   = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999)

  const filteredRows = useMemo(() => {
    if (!dateFrom || !dateTo) return transactions
    const from = startOfDay(dateFrom).getTime()
    const to   = endOfDay(dateTo).getTime()
    if (from > to) return transactions

    return transactions.filter(r => {
      const t = new Date(r.date).getTime()
      return t >= from && t <= to
    })
  }, [transactions, dateFrom, dateTo])

  const clearDates = () => { setDateFrom(null); setDateTo(null) }

  return (
    <div className="main-container">
      <Card title="Transactions" subTitle="Manage your transactions" className="mb-3">
        <ConfirmDialog />

        <div className="transactions-header">
          <div className="left">
            <Button icon="pi pi-plus" label="Add transaction" onClick={onCreate} />
          </div>

          <div className="right date-filter">
            <span className="label">Show from:</span>
            <Calendar
              value={dateFrom}
              onChange={(e) => setDateFrom(e.value as Date | null)}
              dateFormat="yy-mm-dd"
              placeholder="From"
            />
            <span className="label">to:</span>
            <Calendar
              value={dateTo}
              onChange={(e) => setDateTo(e.value as Date | null)}
              dateFormat="yy-mm-dd"
              placeholder="To"
            />
            <Button
              label="Show all"
              icon="pi pi-filter-slash"
              text
              onClick={clearDates}
              className="ml-2"
            />
          </div>
        </div>

        <TransactionsTable
          rows={filteredRows}
          accountsById={accountsById}
          categoriesById={categoriesById}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />

        <TransactionsDialog
          mode={mode}
          visible={dialogOpen}
          initial={editRow ?? undefined}
          onHide={() => { setDialogOpen(false); setEditRow(null); setMode('create') }}
          onSubmit={onSubmit}
          accounts={accounts}
          categories={categories}
        />
      </Card>
    </div>
  )
}
