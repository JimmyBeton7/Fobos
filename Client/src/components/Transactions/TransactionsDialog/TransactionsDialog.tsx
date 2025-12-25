import React, { useEffect, useMemo, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Calendar } from 'primereact/calendar'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import './TransactionsDialog.styles.css'
import type { TransactionRow, AccountRow, CategoryRow } from '../../../../../Electron/types'

type FormKind = 'income' | 'expense'

type FormState = {
  id?: string
  account_id: string | null
  kind: FormKind | null
  amount_cents: number | null
  date: Date | null
  title: string
  note: string
  own_category_id: string | null
}

type Props = {
  mode: 'create' | 'edit' | 'duplicate'
  visible: boolean
  onHide: () => void
  onSubmit: (row: Omit<TransactionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>
  initial?: TransactionRow
  accounts: AccountRow[]
  categories: CategoryRow[]
}

const toForm = (mode: Props['mode'], v?: TransactionRow): FormState => {
  if (!v) {
    return {
      account_id: null,
      kind: null,
      amount_cents: null,
      date: new Date(),
      title: '',
      note: '',
      own_category_id: null,
    }
  }
  return {
    id: mode === 'edit' ? v.id : undefined,
    account_id: v.account_id,
    kind: v.kind,
    amount_cents: v.amount_cents,
    date: v.date ? new Date(v.date) : new Date(),
    title: mode === 'duplicate' ? `${v.title} (copy)` : v.title,
    note: v.note ?? '',
    own_category_id: v.own_category_id ?? null,
  }
}

export default function TransactionsDialog({
  mode,
  visible,
  onHide,
  onSubmit,
  initial,
  accounts,
  categories,
}: Props) {
  const [form, setForm] = useState<FormState>(toForm(mode, initial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setForm(toForm(mode, initial))
      setErrors({})
      setSaving(false)
    }
  }, [visible, initial, mode])

  const accountOptions = useMemo(
    () => accounts.map(a => ({ label: a.name, value: a.id })),
    [accounts]
  )
  const kindOptions = [
    { label: 'income', value: 'income' as const },
    { label: 'expense', value: 'expense' as const },
  ]
  const categoryOptions = useMemo(
    () => categories.map(c => ({ label: c.name, value: c.id })),
    [categories]
  )

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    if (!form.account_id) next.account_id = 'Select account'
    if (!form.kind) next.kind = 'Select kind'
    if (!form.own_category_id) next.own_category_id = 'Select category'
    if (form.amount_cents == null || Number.isNaN(form.amount_cents)) next.amount_cents = 'Enter amount'
    else if (form.amount_cents <= 0) next.amount_cents = 'Amount must be > 0'
    if (!form.date) next.date = 'Podaj datę'
    if (!form.title || !form.title.trim()) next.title = 'Enter title'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (saving) return
    if (!validate()) return

    setSaving(true)
    try {
      await onSubmit({
        id: form.id,
        account_id: form.account_id!,
        kind: form.kind!,
        amount_cents: Math.round(form.amount_cents!),
        date: form.date!.toISOString(),
        title: form.title.trim(),
        note: form.note.trim(),
        own_category_id: form.own_category_id ?? null,
        created_at: '',
        updated_at: '',
      } as TransactionRow)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      header={
        mode === 'edit'
          ? 'Edit transaction'
          : mode === 'duplicate'
            ? 'Duplicate transaction'
            : 'New transaction'
      }
      visible={visible}
      onHide={onHide}
      className="tx-dialog"
      dismissableMask
      blockScroll
      modal
    >
      <div className="tx-form two-col">
        <div className="col">
          <label>Account</label>
          <Dropdown
            value={form.account_id}
            options={accountOptions}
            placeholder="Select account"
            onChange={(e) => setForm(s => ({ ...s, account_id: e.value }))}
            className={errors.account_id ? 'p-invalid' : undefined}
          />
          {errors.account_id && <small className="p-error">{errors.account_id}</small>}
        </div>

        <div className="col">
          <label>Kind</label>
          <Dropdown
            value={form.kind}
            options={kindOptions}
            placeholder="Select kind"
            onChange={(e) => setForm(s => ({ ...s, kind: e.value }))}
            className={errors.kind ? 'p-invalid' : undefined}
          />
          {errors.kind && <small className="p-error">{errors.kind}</small>}
        </div>

        <div className="col">
          <label>Amount</label>
          <InputNumber
            value={form.amount_cents != null ? form.amount_cents / 100 : null}
            onValueChange={(e) => setForm(s => ({ ...s, amount_cents: e.value != null ? Math.round(Number(e.value) * 100) : null }))}
            mode="currency"
            currency="PLN"
            locale="pl-PL"
            className={errors.amount_cents ? 'p-invalid' : undefined}
          />
          {errors.amount_cents && <small className="p-error">{errors.amount_cents}</small>}
        </div>

        <div className="col">
          <label>Date</label>
          <Calendar
            value={form.date}
            onChange={(e) => setForm(s => ({ ...s, date: e.value as Date }))}
            dateFormat="yy-mm-dd"
            className={errors.date ? 'p-invalid' : undefined}
          />
          {errors.date && <small className="p-error">{errors.date}</small>}
        </div>

        <div className="col">
          <label>Own category</label>
          <Dropdown
            value={form.own_category_id}
            options={categoryOptions}
            placeholder="Select category"
            showClear
            onChange={(e) => setForm(s => ({ ...s, own_category_id: e.value }))}
            className={errors.own_category_id ? 'p-invalid' : undefined}
          />
          {errors.own_category_id && <small className="p-error">{errors.own_category_id}</small>}
        </div>

        <div className="col">
          <label>Title</label>
          <InputText
            value={form.title}
            onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))}
            className={errors.title ? 'p-invalid' : undefined}
          />
          {errors.title && <small className="p-error">{errors.title}</small>}
        </div>

        <div className="col col-span-2">
          <label>Note</label>
          <InputTextarea
            autoResize
            rows={3}
            value={form.note}
            onChange={(e) => setForm(s => ({ ...s, note: e.target.value }))}
          />
        </div>
      </div>

      <div className="tx-dialog-actions">
        <Button label="Cancel" text onClick={onHide} />
        <Button label="Save" icon="pi pi-check" onClick={submit} loading={saving} disabled={saving} />
      </div>
    </Dialog>
  )
}
