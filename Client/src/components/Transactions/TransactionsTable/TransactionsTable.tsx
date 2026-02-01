import { type CSSProperties, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import './TransactionsTable.styles.css'
import type { TransactionRow, AccountRow, CategoryRow } from '../../../../../Electron/types'
import { getContrastColor } from "../../helpers/hexToRgb";
import { Tooltip } from 'primereact/tooltip'
import { useIsMobile } from "../../helpers/useIsMobile";
import { Skeleton } from 'primereact/skeleton'

type Props = {
  rows: TransactionRow[]
  accountsById: Record<string, AccountRow>
  categoriesById: Record<string, CategoryRow>
  onEdit: (row: TransactionRow) => void
  onDuplicate: (row: TransactionRow) => void
  onDelete: (row: TransactionRow) => void
  loading?: boolean
}

const formatPln = (cents: number) =>
  (cents / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

export default function TransactionsTable({
  rows,
  accountsById,
  categoriesById,
  onEdit,
  onDuplicate,
  onDelete,
  loading
}: Props) {

  const isMobile = useIsMobile()
  const tableRows = useMemo(() => {
    return rows.map(r => ({
      ...r,
      _accountName: accountsById[r.account_id]?.name ?? '',
      _accountColor: accountsById[r.account_id]?.color_hex ?? '#e5e7eb',
      _categoryName: r.own_category_id ? (categoriesById[r.own_category_id]?.name?? '') : '',
      _categoryColor: r.own_category_id ? (categoriesById[r.own_category_id]?.color_hex ?? '#e5e7eb') : '#e5e7eb',
    }))
  }, [rows, accountsById, categoriesById])

  const skeletonRows = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` } as any)), [])
  const sk = (w?: string) => <Skeleton width={w ?? '100%'} height="1.25rem" />
  const bankSk = () => sk('9rem')
  const titleSk = () => sk()
  const amountSk = () => <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{sk('6rem')}</div>
  const catSk = () => sk('10rem')
  const dateSk = () => sk('7rem')
  const actionsSk = () => (
    <div className="tx-actions">
      <Skeleton width="2rem" height="2rem" />
      <Skeleton width="2rem" height="2rem" />
      <Skeleton width="2rem" height="2rem" />
    </div>
  )

  const bankBody = (row: TransactionRow) => {
    const acc = accountsById[row.account_id]
    const bg = acc?.color_hex ?? '#e5e7eb'
    const fg = getContrastColor(bg)
    const label = acc?.name ?? '—'
    const balanceTooltip = acc ? `Balance: ${formatPln(acc.current_amount_cents)}` : 'No data'

    const style = {
      ['--acc-bg' as any]: bg,
      ['--acc-fg' as any]: fg,
    } as CSSProperties

    return (
      <div className="account-name-cell" style={style}>
      <span
        className="account-name-chip has-acc-tooltip"
        data-pr-tooltip={balanceTooltip}
      >
        {label}
      </span>
      </div>
    )
  }

  const titleBody = (row: TransactionRow) => <span className="tx-title">{row.title}</span>

  const amountBody = (row: TransactionRow) => (
    <span className={`tx-amount ${row.kind === 'income' ? 'pos' : 'neg'}`}>
      {formatPln(row.amount_cents)}
    </span>
  )

  const ownCatBody = (row: TransactionRow) => {
    const category = row.own_category_id ? categoriesById[row.own_category_id] : undefined
    const bg = category?.color_hex ?? '#e5e7eb'
    const fg = getContrastColor(bg)
    const label = category?.name ?? '—'

    const style = {
      ['--cat-bg' as any]: bg,
      ['--cat-fg' as any]: fg,
    } as CSSProperties

    return (
      <div className="category-name-cell" style={style}>
        <span className="category-name-chip">{label}</span>
      </div>
    )
  }

  const dateBody = (row: TransactionRow) => {
    const d = new Date(row.date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const actionsBody = (row: TransactionRow) => (
    <div className="tx-actions">
      <Button icon="pi pi-pencil" text onClick={() => onEdit(row)} />
      <Button icon="pi pi-clone" text onClick={() => onDuplicate(row)} />
      <Button icon="pi pi-trash" text severity="danger" onClick={() => onDelete(row)} />
    </div>
  )

  if (isMobile) {
    return (
      <div className="transactions-cards">
        {rows.map((row) => (
          <div key={row.id} className="transaction-card">
            <div className="transaction-card-header">
              {bankBody(row)}
              <span className="transaction-card-date">{dateBody(row)}</span>
            </div>

            <div className="transaction-card-body">
              <div className="transaction-card-row">
                <span className="transaction-card-label">Title</span>
                <span className="transaction-card-value">{row.title}</span>
              </div>

              <div className="transaction-card-row">
                <span className="transaction-card-label">Amount</span>
                <span className="transaction-card-value">
                  {amountBody(row)}
                </span>
              </div>

              <div className="transaction-card-row">
                <span className="transaction-card-label">Category</span>
                <span className="transaction-card-value">
                  {ownCatBody(row)}
                </span>
              </div>

              {row.note && row.note.trim() && (
                <div className="transaction-card-row">
                  <span className="transaction-card-label">Note</span>
                  <span className="transaction-card-value transaction-card-note">
                    {row.note}
                  </span>
                </div>
              )}
            </div>

            <div className="transaction-card-footer">
              {actionsBody(row)}
            </div>
          </div>
        ))}
      </div>
    )
  }


  return (
    <>
      {!loading && (
        <Tooltip
          key={rows.length}
          target=".has-acc-tooltip"
          position="right"
          showDelay={400}
          appendTo={document.body}
        />
      )}

      <DataTable
        value={loading ? skeletonRows : tableRows}
        tableStyle={{ minWidth: 900 }}
        stripedRows
        showGridlines
        sortMode="multiple"
        removableSort
      >
        <Column header="Bank" body={loading ? bankSk : bankBody} sortable={!loading} sortField="_accountName" />
        <Column header="Title" body={loading ? titleSk : titleBody} sortable={!loading} sortField="title" />
        <Column header="Amount" body={loading ? amountSk : amountBody} sortable={!loading} sortField="amount_cents" style={{ width: 120, textAlign: 'right' }} />
        <Column header="Own category" body={loading ? catSk : ownCatBody} sortable={!loading} sortField="_categoryName" />
        <Column header="Date" body={loading ? dateSk : dateBody} style={{ width: 140 }} />
        <Column header="Actions" body={loading ? actionsSk : actionsBody} style={{ width: 120 }} />
      </DataTable>
    </>
  )}
