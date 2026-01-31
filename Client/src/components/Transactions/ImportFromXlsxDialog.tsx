import { useMemo, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Checkbox } from 'primereact/checkbox'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Skeleton } from 'primereact/skeleton'
import type { AccountRow, CategoryRow } from '../../../../Electron/types'
import type { ImportTransactionDraft } from 'DataApi/types'
import { parseSantanderXlsx } from 'DataApi/importers/santanderXlsx'
import { api } from 'DataApi'

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
      if (missingCat) {
        throw new Error('Select category for all included rows.')
      }

      for (const r of toImport) {
        await api.transactions.upsert({
          accountId: santanderAccountId,
          kind: r.kind,
          ownCategoryId: r.ownCategoryId!,
          amountCents: r.amountCents,
          date: r.date,
          title: r.title,
          note: undefined,
        })
      }

      await onImported()
      setRows([])
      setFileName(null)
      onHide()
    } finally {
      setLoading(false)
    }
  }

  const header = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onPickFile(f)
          }}
        />
        {fileName ? <span style={{ opacity: 0.7 }}>{fileName}</span> : null}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
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
  )

  const includeBody = (r: ImportTransactionDraft) => (
    <Checkbox
      checked={r.include}
      onChange={(e) => updateRow(r.tempId, { include: !!e.checked })}
    />
  )

  const titleBody = (r: ImportTransactionDraft) => (
    <InputText
      value={r.title}
      onChange={(e) => updateRow(r.tempId, { title: e.target.value })}
      style={{ width: '100%' }}
    />
  )

  const amountBody = (r: ImportTransactionDraft) => (
    <span style={{ fontWeight: 600 }}>
      {r.kind === 'expense' ? '-' : '+'}{formatPln(r.amountCents)}
    </span>
  )

  const categoryBody = (r: ImportTransactionDraft) => (
    <Dropdown
      value={r.ownCategoryId}
      options={categoryOptions}
      placeholder="Select category"
      onChange={(e) => updateRow(r.tempId, { ownCategoryId: e.value })}
      style={{ width: '100%' }}
    />
  )

  const loadingTable = (
    <div style={{ padding: 12 }}>
      <Skeleton width="100%" height="2rem" className="mb-2" />
      <Skeleton width="100%" height="2rem" className="mb-2" />
      <Skeleton width="100%" height="2rem" className="mb-2" />
      <Skeleton width="100%" height="2rem" />
    </div>
  )

  return (
    <Dialog
      header="Import transactions (Santander XLSX)"
      visible={visible}
      onHide={onHide}
      style={{ width: 'min(1100px, 95vw)' }}
      modal
    >
      {header}

      <div style={{ marginTop: 12 }}>
        {!santanderAccountId && (
          <div style={{ color: 'tomato', marginBottom: 12 }}>
            Santander account not found. Add an account with name containing "Santander".
          </div>
        )}

        {loading && rows.length === 0 ? loadingTable : (
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
