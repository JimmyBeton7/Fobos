import React, { useCallback, useState } from 'react'
import JSZip from 'jszip'
import { Button } from 'primereact/button'
import { supabaseUrl, supabaseAnonKey } from '../../supabaseClient'
import './Home.styles.css'

type BackupState = 'idle' | 'running' | 'success' | 'error'

const TABLES = [
  { table: 'account', fileName: 'accounts.csv' },
  { table: 'category', fileName: 'categories.csv' },
  { table: 'transaction', fileName: 'transactions.csv' },
]

async function fetchTableCsv(table: string): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration error')
  }

  const url = `${supabaseUrl}/rest/v1/${table}?select=*`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: 'text/csv',
      Prefer: 'headers-only=false',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Cannot download table "${table}": ${res.status} ${res.statusText} ${text}`,
    )
  }

  return res.text()
}

function buildBackupFileName() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')

  const yyyy = now.getFullYear()
  const mm = pad(now.getMonth() + 1)
  const dd = pad(now.getDate())
  const hh = pad(now.getHours())
  const mi = pad(now.getMinutes())

  return `fobos_backup_${yyyy}-${mm}-${dd}_${hh}-${mi}.zip`
}

export const Home: React.FC = () => {
  const [state, setState] = useState<BackupState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleDownloadBackup = useCallback(async () => {
    setState('running')
    setMessage(null)

    try {
      const zip = new JSZip()
      const folderName = 'fobos_backup'
      const folder = zip.folder(folderName) ?? zip

      for (const { table, fileName } of TABLES) {
        const csv = await fetchTableCsv(table)
        folder.file(fileName, csv)
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const fileName = buildBackupFileName()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setState('success')
      setMessage(`Backup created and downloaded ${fileName}.`)
    } catch (err: any) {
      console.error('[Backup] Error:', err)
      setState('error')
      setMessage(err?.message ?? 'Cannot create backup')
    }
  }, [])

  const isRunning = state === 'running'

  return (
    <div className="home-backup">
      <h1 className="home-backup__title">Backup Supabase → CSV (ZIP)</h1>

      <div className="home-backup__controls">
        <Button
          label={isRunning ? 'Creating backup' : 'Download backup'}
          icon={isRunning ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
          onClick={handleDownloadBackup}
          disabled={isRunning}
        />
        {isRunning && <span className="home-backup__status-text">Exporting...</span>}
      </div>

      {message && (
        <div
          className={[
            'home-backup__message',
            state === 'error'
              ? 'home-backup__message--error'
              : 'home-backup__message--success',
          ].join(' ')}
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default Home
