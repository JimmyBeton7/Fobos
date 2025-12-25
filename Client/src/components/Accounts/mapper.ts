import { AccountRow } from "../../../../Electron/types";

export function fromRow(row: AccountRow) {
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex,
    description: row.description ?? undefined,
    currentAmount: (row.current_amount_cents ?? 0) / 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
