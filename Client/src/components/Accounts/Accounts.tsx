import { useEffect, useState, useMemo } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import AccountDialog from './AccountDialog/AccountDialog'
import AccountTable from './AccountsTable/AccountsTable'
import { fromRow } from './mapper'
import type { Account } from './types'
import { api } from '../../api'
import './AccountsTable/AccountsTable.styles.css'
import { useData } from '../DataContext'

export default function Accounts() {

  const { accounts: accountRows, reloadAccounts } = useData()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<Account | null>(null)

  const rows = useMemo(
    () => accountRows.map(fromRow),
    [accountRows]
  )

  const onCreate = () => {
    setEditRow(null)
    setDialogOpen(true)
  }

  const onEdit = (row: Account) => {
    setEditRow(row)
    setDialogOpen(true)
  }

  const onDelete = (row: Account) => {
    confirmDialog({
      header: 'Confirm deletion',
      message: `Delete account "${row.name}"? This action cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      rejectLabel: 'Cancel',
      acceptLabel: 'Delete',
      accept: async () => {
        await api.accounts.delete(row.id)
        await reloadAccounts()
      }
    })
  }

  const onSubmit = async (data: { id?: string; name: string; colorHex: string; description?: string; currentAmount: number }) => {
    await api.accounts.upsert(data)
    await reloadAccounts()
    setDialogOpen(false)
    setEditRow(null)
  }

  return (
    <div className="main-container">
      <Card title="Bank accounts" subTitle="Accounts management" className="mb-3">

        <ConfirmDialog />

        <div className="accounts-header">
          <Button icon="pi pi-plus" label="Add account" onClick={onCreate} />
        </div>

        <AccountTable rows={rows} onEdit={onEdit} onDelete={onDelete} />

        <AccountDialog
          visible={dialogOpen}
          initial={editRow ?? undefined}
          onHide={() => { setDialogOpen(false); setEditRow(null) }}
          onSubmit={onSubmit}
        />
      </Card>
    </div>
  )
}
