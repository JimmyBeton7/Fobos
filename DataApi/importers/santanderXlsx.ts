import * as XLSX from 'xlsx'
import type { ImportTransactionDraft } from '../types'

const HEADER_MARKERS = ['Data operacji', 'Tytuł', 'Kwota', 'Waluta']

function toIsoDatePL(d: any): string {
  // Santander export ma zwykle "DD/MM/YYYY" jako string
  if (typeof d === 'string') {
    const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
      const [, dd, mm, yyyy] = m
      return `${yyyy}-${mm}-${dd}`
    }
  }
  // fallback: excel date number
  if (typeof d === 'number') {
    // XLSX.read() często daje Date jako number → konwersja przez XLSX.SSF
    const parsed = XLSX.SSF.parse_date_code(d)
    if (parsed?.y && parsed?.m && parsed?.d) {
      const yyyy = String(parsed.y).padStart(4, '0')
      const mm = String(parsed.m).padStart(2, '0')
      const dd = String(parsed.d).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }
  throw new Error(`Unrecognized date format: ${String(d)}`)
}

function parseAmountToCents(v: any): { centsAbs: number; kind: 'income' | 'expense' } {
  // w Twoim pliku "Kwota" jest number (np. -55.72), czasem może być string " -55,72"
  let num: number
  if (typeof v === 'number') num = v
  else {
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.')
    num = Number(s)
  }
  if (!Number.isFinite(num)) throw new Error(`Invalid amount: ${String(v)}`)
  const kind = num >= 0 ? 'income' : 'expense'
  const centsAbs = Math.round(Math.abs(num) * 100)
  return { centsAbs, kind }
}

function findHeaderRowIndex(rows: any[][]): number {
  // szukamy w pierwszych ~50 wierszach takiego, który zawiera wszystkie marker-y
  const max = Math.min(rows.length, 60)
  for (let i = 0; i < max; i++) {
    const row = rows[i] ?? []
    const rowStr = row.map(c => String(c ?? '').trim())
    const ok = HEADER_MARKERS.every(m => rowStr.includes(m))
    if (ok) return i
  }
  return -1
}

export async function parseSantanderXlsx(file: File): Promise<ImportTransactionDraft[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  if (!ws) throw new Error('No worksheet found')

  // odczyt jako tablica wierszy
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][]
  const headerRowIdx = findHeaderRowIndex(rows)
  if (headerRowIdx < 0) {
    throw new Error('Cannot find Santander header row (Data operacji / Tytuł / Kwota / Waluta).')
  }

  const header = rows[headerRowIdx].map(c => String(c ?? '').trim())
  const colIndex = (name: string) => header.indexOf(name)

  const idxDate = colIndex('Data operacji')
  const idxTitle = colIndex('Tytuł')
  const idxBankCat = colIndex('Kategoria')
  const idxAmount = colIndex('Kwota')
  const idxCurrency = colIndex('Waluta')

  if ([idxDate, idxTitle, idxAmount, idxCurrency].some(i => i < 0)) {
    throw new Error('Missing required columns in XLSX.')
  }

  const out: ImportTransactionDraft[] = []

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || r.length === 0) continue

    const dateCell = r[idxDate]
    const titleCell = r[idxTitle]
    const amountCell = r[idxAmount]
    const currencyCell = r[idxCurrency]
    const bankCatCell = idxBankCat >= 0 ? r[idxBankCat] : null

    // pomiń puste linie
    if (!dateCell && !titleCell && (amountCell === null || amountCell === undefined)) continue
    if (!dateCell || !titleCell || amountCell === null || amountCell === undefined) continue

    const date = toIsoDatePL(dateCell)
    const title = String(titleCell).trim()
    const currency = String(currencyCell ?? '').trim() || 'PLN'
    const { centsAbs, kind } = parseAmountToCents(amountCell)

    // np. możesz od razu odrzucić waluty != PLN:
    // if (currency !== 'PLN') continue

    out.push({
      tempId: crypto.randomUUID(),
      include: true,
      date,
      title,
      amountCents: centsAbs,
      kind,
      currency,
      bankCategory: bankCatCell ? String(bankCatCell).trim() : null,
      ownCategoryId: null,
    })
  }

  return out
}
