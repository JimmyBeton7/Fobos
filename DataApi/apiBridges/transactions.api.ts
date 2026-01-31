import type { TransactionsApi } from "../types"
import { supabase } from "../supaBase.client"
import type { TransactionRow, AccountRow } from "../../Electron/types"
import { useEmitStatus } from "../statusListener.ts"

export const transactionsApi: TransactionsApi = {
  async listAll() {
    return useEmitStatus(
      {
        scope: "transactions",
        action: "list",
        errorMessage: "Transactions listing failed",
        emitSuccess: false,
      },
      async () => {
        const { data, error } = await supabase
          .from("transaction")
          .select("*")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) throw error
        return (data ?? []) as TransactionRow[]
      }
    )
  },

  async listByAccount(accountId: string) {
    return useEmitStatus(
      {
        scope: "transactions",
        action: "list",
        errorMessage: "Transactions listing by account failed",
        emitSuccess: false,
      },
      async () => {
        const { data, error } = await supabase
          .from("transaction")
          .select("*")
          .eq("account_id", accountId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })

        if (error) throw error
        return (data ?? []) as TransactionRow[]
      }
    )
  },

  async upsert(d) {
    const isNew = !d.id

    return useEmitStatus(
      {
        scope: "transactions",
        action: "upsert",
        successMessage: isNew ? "Transaction created" : "Transaction updated",
        errorMessage: "Transaction save failed",
      },
      async () => {
        const now = new Date().toISOString()
        const id = d.id ?? crypto.randomUUID()

        let deltaDiff = 0
        let prevTx: TransactionRow | null = null

        if (isNew) {
          deltaDiff = d.kind === "income" ? d.amountCents : -d.amountCents
        } else {
          const { data: prev, error: prevErr } = await supabase
            .from("transaction")
            .select("*")
            .eq("id", id)
            .maybeSingle()

          if (prevErr) throw prevErr
          if (!prev) throw new Error("Transaction not found")

          prevTx = prev as TransactionRow

          const prevSigned = prevTx.kind === "income" ? prevTx.amount_cents : -prevTx.amount_cents
          const newSigned = d.kind === "income" ? d.amountCents : -d.amountCents
          deltaDiff = newSigned - prevSigned
        }

        const txRow: TransactionRow = {
          id,
          account_id: d.accountId,
          kind: d.kind,
          own_category_id: d.ownCategoryId ?? null,
          amount_cents: d.amountCents,
          date: d.date,
          title: d.title,
          note: d.note ?? null,
          created_at: prevTx?.created_at ?? now,
          updated_at: now,
        }

        const { error: upsertTxErr } = await supabase
          .from("transaction")
          .upsert(txRow, { onConflict: "id" })

        if (upsertTxErr) throw upsertTxErr

        if (deltaDiff !== 0) {
          const { data: acc, error: accErr } = await supabase
            .from("account")
            .select("*")
            .eq("id", d.accountId)
            .maybeSingle()

          if (accErr) throw accErr
          if (!acc) throw new Error("Account not found for transaction")

          const accRow = acc as AccountRow
          const newBalance = accRow.current_amount_cents + deltaDiff

          const txDate = d.date
          const prevBCM = accRow.balance_changed_manually
          const shouldBcmBeTxDate = !prevBCM || new Date(prevBCM) < new Date(txDate)

          const { error: updAccErr } = await supabase
            .from("account")
            .update({
              current_amount_cents: newBalance,
              balance_changed_manually: shouldBcmBeTxDate ? txDate : prevBCM,
              updated_at: now,
            })
            .eq("id", d.accountId)

          if (updAccErr) throw updAccErr
        }

        return { ok: true, id }
      }
    )
  },

  async delete(id: string) {
    return useEmitStatus(
      {
        scope: "transactions",
        action: "delete",
        successMessage: "Transaction deleted",
        errorMessage: "Transaction deletion failed",
      },
      async () => {
        const now = new Date().toISOString()

        const { data: prev, error: prevErr } = await supabase
          .from("transaction")
          .select("account_id, kind, amount_cents, date")
          .eq("id", id)
          .maybeSingle()

        if (prevErr) throw prevErr
        if (!prev) return { ok: true }

        const prevTx = prev as Pick<TransactionRow, "account_id" | "kind" | "amount_cents" | "date">

        const signed = prevTx.kind === "income" ? prevTx.amount_cents : -prevTx.amount_cents
        const deltaUndo = -signed

        const { error: delErr } = await supabase
          .from("transaction")
          .delete()
          .eq("id", id)

        if (delErr) throw delErr

        const { data: acc, error: accErr } = await supabase
          .from("account")
          .select("*")
          .eq("id", prevTx.account_id)
          .maybeSingle()

        if (accErr) throw accErr
        if (!acc) return { ok: true }

        const accRow = acc as AccountRow
        const newBalance = accRow.current_amount_cents + deltaUndo

        const { error: updAccErr } = await supabase
          .from("account")
          .update({
            current_amount_cents: newBalance,
            updated_at: now,
          })
          .eq("id", prevTx.account_id)

        if (updAccErr) throw updAccErr

        return { ok: true }
      }
    )
  },
}
