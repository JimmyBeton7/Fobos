import { useMemo, useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Calendar } from 'primereact/calendar'
import TransactionsTable from './TransactionsTable/TransactionsTable'
import TransactionsDialog from './TransactionsDialog/TransactionsDialog'
import type { TransactionRow } from '../../../../Electron/types'
import { api } from 'DataApi'
import { useData } from '../DataContext'
import { useTransactionsState } from './TransactionsStateContext'
import ImportFromXlsxDialog from './ImportFromXlsxDialog'
import './Transaction.styles.css'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export default function Transactions() {
  const {
    accounts,
    categories,
    transactions,
    reloadTransactions,
    reloadAccounts,
    loading
  } = useData()

  const {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    initialized,
    setInitialized,
  } = useTransactionsState()

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<TransactionRow | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (initialized) return
    const now = new Date()
    setDateFrom(startOfMonth(now))
    setDateTo(endOfMonth(now))
    setInitialized(true)
  }, [initialized, setDateFrom, setDateTo, setInitialized])

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

  const clearDates = () => {
    const now = new Date()
    setDateFrom(startOfMonth(now))
    setDateTo(endOfMonth(now))
  }

  return (
    <div className="main-container">
      <Card title="Transactions" subTitle="Manage your transactions" className="mb-3">
        <ConfirmDialog />

        <div className="transactions-header">
          <div className="left">
            <Button icon="pi pi-plus" label="Add transaction" onClick={onCreate} />
            <Button icon="pi pi-file-arrow-up" label="Add from XLSX" onClick={() => setImportOpen(true)} />
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
              label="Show current"
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
          loading={loading.transactions}
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

      <ImportFromXlsxDialog
        visible={importOpen}
        onHide={() => setImportOpen(false)}
        accounts={accounts}
        categories={categories}
        onImported={async () => {
          await Promise.all([reloadTransactions(), reloadAccounts()])
        }}
      />
    </div>
  )
}
