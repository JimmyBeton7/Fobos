import * as XLSX from 'xlsx'
import type { ImportTransactionDraft } from '../types'

function toIsoDate(dmy: string) {
  const [dd, mm, yyyy] = dmy.split('/')
  return `${yyyy}-${mm}-${dd}`
}

function parseAmount(amount: string): { kind: 'income' | 'expense'; amountCents: number } {
  const n = Number(amount)
  const kind: 'income' | 'expense' = n >= 0 ? 'income' : 'expense'
  const amountCents = Math.round(Math.abs(n) * 100)
  return { kind, amountCents }
}

export async function parseSantanderXlsx(file: File): Promise<ImportTransactionDraft[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 10, raw: true }) as any[][]

  const out: ImportTransactionDraft[] = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue

    const amountCell = r[4]
    if (amountCell === null || amountCell === undefined || String(amountCell).trim() === '') {
      continue
    }

    const dateCell = String(r[0])
    const titleCell = String(r[1] ?? '')
    const bankCategoryCell = String(r[2] ?? '')
    //const amountCell = String(r[4] ?? '0')
    const currencyCell = String(r[5] ?? 'PLN')

    const { kind, amountCents } = parseAmount(amountCell)

    out.push({
      tempId: crypto.randomUUID(),
      include: true,
      date: toIsoDate(dateCell),
      title: titleCell.trim(),
      amountCents,
      kind,
      currency: currencyCell,
      bankCategory: bankCategoryCell.trim(),
      ownCategoryId: null,
    })
  }

  return out
}
