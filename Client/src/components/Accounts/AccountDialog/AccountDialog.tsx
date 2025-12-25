import { useEffect, useState, useMemo } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { ColorPicker } from 'primereact/colorpicker'
import { Button } from 'primereact/button'
import type { Account } from '../types'
import './AccountDialog.styles.css'
import { InputTextarea } from "primereact/inputtextarea";

type Props = {
  visible: boolean
  initial?: Account
  onHide: () => void
  onSubmit: (data: { id?: string; name: string; colorHex: string; description?: string; currentAmount: number }) => Promise<void>
}

const isHexColor = (v: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v)

export default function AccountDialog({ visible, initial, onHide, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [colorHex, setColorHex] = useState('#1976d2')
  const [description, setDescription] = useState('')
  const [currentAmount, setCurrentAmount] = useState<number | null>(0)

  const [touched, setTouched] = useState<{name?: boolean; desc?: boolean; color?: boolean}>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setColorHex(initial.colorHex || '#1976d2')
      setDescription(initial.description || '')
      setCurrentAmount(initial.currentAmount ?? 0)
    } else {
      setName('')
      setColorHex('#1976d2')
      setDescription('')
      setCurrentAmount(0)
    }
    setTouched({})
    setSaving(false)
  }, [initial, visible])

  const errors = useMemo(() => {
    const e: { name?: string; desc?: string; color?: string } = {}
    if (!name.trim()) e.name = 'Account name is required'
    if (!description.trim()) e.desc = 'Description is required'
    const norm = colorHex.startsWith('#') ? colorHex : `#${colorHex}`
    if (!isHexColor(norm)) e.color = 'Provide valid HEX color (e.g. #1976d2)'
    return e
  }, [name, description, colorHex])

  const isValid = Object.keys(errors).length === 0

  const save = async () => {
    if (saving) return
    if (!isValid) {
      setTouched({ name: true, desc: true, color: true })
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        id: initial?.id,
        name: name.trim(),
        colorHex: colorHex.startsWith('#') ? colorHex : `#${colorHex}`,
        description: description.trim() || undefined,
        currentAmount: Number(currentAmount ?? 0),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      header={initial ? 'Edit account' : 'New account'}
      visible={visible}
      onHide={onHide}
      className="account-dialog"
    >
      <div className="account-dialog-form">
        <div className="account-name-field">
          <label htmlFor="name">Account name</label>
          <InputText
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className={touched.name && errors.name ? 'p-invalid' : undefined}
          />
          {touched.name && errors.name && <small className="p-error">{errors.name}</small>}
        </div>

        <div className="account-dialog-row">
          <div className="account-balance-field">
            <label htmlFor="amount">Starting balance</label>
            <InputNumber
              id="amount"
              value={currentAmount ?? 0}
              onValueChange={(e) => setCurrentAmount(e.value ?? 0)}
              mode="currency"
              currency="PLN"
              locale="pl-PL"
            />
          </div>

          <div className="account-color-field">
            <label>Color</label>
            <div className="account-dialog__color">
              <ColorPicker
                format="hex"
                value={colorHex.replace('#', '')}
                onChange={(e) => setColorHex(`#${e.value}`)}
                onBlur={() => setTouched((t) => ({ ...t, color: true }))}
              />
              <span>{colorHex}</span>
            </div>
            {touched.color && errors.color && <small className="p-error">{errors.color}</small>}
          </div>
        </div>

        <div className="account-description-field">
          <label htmlFor="desc">Description</label>
          <InputTextarea
            id="desc"
            value={description}
            autoResize={true}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, desc: true }))}
            className={touched.desc && errors.desc ? 'p-invalid' : undefined}
          />
          {touched.desc && errors.desc && <small className="p-error">{errors.desc}</small>}
        </div>
      </div>

      <div className="account-dialog__footer">
        <Button label="Cancel" icon="pi pi-cancel" text onClick={onHide} />
        <Button label="Save" icon="pi pi-check" onClick={save} loading={saving} disabled={saving} />
      </div>
    </Dialog>
  )
}
