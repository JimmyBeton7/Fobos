import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import type { Account } from '../types'
import './AccountsTable.styles.css'
import { CSSProperties } from 'react'
import { getContrastColor } from "../../helpers/hexToRgb";
import { Card } from 'primereact/card'
import { useIsMobile } from "../../helpers/useIsMobile";

type Props = {
  rows: Account[]
  onEdit: (row: Account) => void
  onDelete: (row: Account) => void
}

export default function AccountTable({ rows, onEdit, onDelete }: Props) {

  const isMobile = useIsMobile()
  const amountBody = (row: Account) =>
    row.currentAmount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

  const nameBody = (row: Account) => {
    const bg = row.colorHex
    const fg = getContrastColor(bg)
    const style = {
      ['--acc-bg' as any]: bg,
      ['--acc-fg' as any]: fg
    } as CSSProperties

    return (
      <div className="account-name-cell" style={style}>
        <span className="account-name-chip">{row.name}</span>
      </div>
    )
  }

  const actionsBody = (row: Account) => (
    <div className="account-actions">
      <Button icon="pi pi-pencil" text onClick={() => onEdit(row)} />
      <Button icon="pi pi-trash" text severity="danger" onClick={() => onDelete(row)} />
    </div>
  )

  if (isMobile) {
    return (
      <div className="accounts-cards">
        {rows.map((row) => (
          <Card
            key={row.id}
            className="account-card"
            header={nameBody(row)}
          >
            <div className="account-card-body">
              {row.description && (
                <div className="account-card-row">
                  <span className="account-card-label">Description</span>
                  <span className="account-card-value">{row.description}</span>
                </div>
              )}

              <div className="account-card-row">
                <span className="account-card-label">Balance</span>
                <span className="account-card-value account-card-balance">
                  {amountBody(row)}
                </span>
              </div>

              <div className="account-card-footer">
                {actionsBody(row)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DataTable
      value={rows}
      size="small"
      stripedRows
      showGridlines
      scrollable
      scrollHeight="60vh"
      className="accounts-table"
    >
      <Column header="Name" body={nameBody} className="col-name" />
      <Column field="description" header="Description" />
      <Column header="Balance" body={amountBody} className="col-balance" />
      <Column header="" body={actionsBody} className="col-actions" />
    </DataTable>
  )
}
