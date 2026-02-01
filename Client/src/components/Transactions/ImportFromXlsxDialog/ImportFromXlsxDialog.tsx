import { useMemo, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Skeleton } from 'primereact/skeleton'
import type { AccountRow, CategoryRow } from '../../../../../Electron/types'
import type { ImportTransactionDraft } from 'DataApi/types'
import { parseSantanderXlsx } from 'DataApi/importers/santanderXlsx'
import { api } from 'DataApi'
import './ImportFromXlsxDialog.styles.css'

type Props = {
  visible: boolean
  onHide: () => void
  accounts: AccountRow[]
  categories: CategoryRow[]
  onImported: () => Promise<void>
}

const formatPln = (cents: number) =>
  (cents / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

export default function ImportFromXlsxDialog(props: Props) {
  const { visible, onHide, accounts, categories, onImported } = props

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ImportTransactionDraft[]>([])
  const [fileName, setFileName] = useState<string | null>(null)

  const santanderAccountId = useMemo(() => {
    const acc = accounts.find(a => a.name.toLowerCase().includes('santander'))
    return acc?.id ?? null
  }, [accounts])

  const categoryOptions = useMemo(
    () => categories.map(c => ({ label: c.name, value: c.id })),
    [categories]
  )

  const canImport = useMemo(() => {
    if (!santanderAccountId) return false
    const included = rows.filter(r => r.include)
    if (included.length === 0) return false
    return included.every(r => !!r.ownCategoryId && r.title.trim().length > 0 && r.amountCents > 0)
  }, [rows, santanderAccountId])

  const onPickFile = async (f: File) => {
    setLoading(true)
    try {
      setFileName(f.name)
      const parsed = await parseSantanderXlsx(f)
      setRows(parsed)
    } finally {
      setLoading(false)
    }
  }

  const updateRow = (tempId: string, patch: Partial<ImportTransactionDraft>) => {
    setRows(prev => prev.map(r => (r.tempId === tempId ? { ...r, ...patch } : r)))
  }

  const importNow = async () => {
    if (!santanderAccountId) return
    setLoading(true)
    try {
      const toImport = rows.filter(r => r.include)

      const missingCat = toImport.find(r => !r.ownCategoryId)
      if (missingCat) throw new Error('Select category for all included rows.')

      await api.transactions.importBatch({
        accountId: santanderAccountId,
        items: toImport.map(r => ({
          kind: r.kind,
          ownCategoryId: r.ownCategoryId!,
          amountCents: r.amountCents,
          date: r.date,
          title: r.title,
        })),
      })

      await onImported()
      setRows([])
      setFileName(null)
      onHide()
    } finally {
      setLoading(false)
    }
  }

  const includeBody = (r: ImportTransactionDraft) => (
    <Checkbox checked={r.include} onChange={(e) => updateRow(r.tempId, { include: !!e.checked })} />
  )

  const titleBody = (r: ImportTransactionDraft) => (
    <InputText
      value={r.title}
      onChange={(e) => updateRow(r.tempId, { title: e.target.value })}
      className="import-xlsx-title-input"
    />
  )

  const amountBody = (r: ImportTransactionDraft) => (
    <span className="import-xlsx-amount">
      {r.kind === 'expense' ? '-' : '+'}{formatPln(r.amountCents)}
    </span>
  )

  const categoryBody = (r: ImportTransactionDraft) => (
    <Dropdown
      value={r.ownCategoryId}
      options={categoryOptions}
      placeholder="Select category"
      onChange={(e) => updateRow(r.tempId, { ownCategoryId: e.value })}
      className="import-xlsx-category"
    />
  )

  return (
    <Dialog
      header="Import transactions (Santander XLSX)"
      visible={visible}
      onHide={onHide}
      className="import-xlsx-dialog"
      modal
    >
      <div className="import-xlsx-header">
        <div className="import-xlsx-left">
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPickFile(f)
            }}
          />
          {fileName ? <span className="import-xlsx-filename">{fileName}</span> : null}
        </div>

        <div className="import-xlsx-actions">
          <Button
            label="Clear"
            icon="pi pi-trash"
            text
            disabled={loading || rows.length === 0}
            onClick={() => { setRows([]); setFileName(null) }}
          />
          <Button
            label="Import"
            icon="pi pi-check"
            disabled={!canImport || loading}
            onClick={() => void importNow()}
          />
        </div>
      </div>

      <div className="import-xlsx-body">
        {!santanderAccountId && (
          <div className="import-xlsx-warning">
            Santander account not found. Add an account with name containing "Santander".
          </div>
        )}

        {loading && rows.length === 0 ? (
          <div className="import-xlsx-loading">
            <Skeleton width="100%" height="2rem" className="mb-2" />
            <Skeleton width="100%" height="2rem" className="mb-2" />
            <Skeleton width="100%" height="2rem" className="mb-2" />
            <Skeleton width="100%" height="2rem" />
          </div>
        ) : (
          <DataTable value={rows} stripedRows showGridlines scrollable scrollHeight="55vh">
            <Column header="Use" body={includeBody} style={{ width: 70 }} />
            <Column field="date" header="Date" style={{ width: 130 }} />
            <Column header="Title" body={titleBody} />
            <Column header="Amount" body={amountBody} style={{ width: 150, textAlign: 'right' }} />
            <Column field="bankCategory" header="Bank cat" style={{ width: 170 }} />
            <Column header="Your category" body={categoryBody} style={{ width: 220 }} />
          </DataTable>
        )}
      </div>
    </Dialog>
  )
}
