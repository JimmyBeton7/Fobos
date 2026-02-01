import type { AccountsApi } from "../types.ts"
import { supabase } from "../supaBase.client"
import type { AccountRow } from "../../Electron/types"
import { useEmitStatus } from "../statusListener"

export const accountsApi: AccountsApi = {
  async list() {
    return useEmitStatus(
      {
        scope: "accounts",
        action: "list",
        errorMessage: "Accounts listing failed",
        emitSuccess: false,
      },
      async () => {
        const { data, error } = await supabase
          .from("account")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error
        return (data ?? []) as AccountRow[]
      }
    )
  },

  async upsert(d) {
    const isNew = !d.id

    return useEmitStatus(
      {
        scope: "accounts",
        action: "upsert",
        successMessage: isNew ? "Account created" : "Account updated",
        errorMessage: "Account save failed",
      },
      async () => {
        const now = new Date().toISOString()
        const id = d.id ?? crypto.randomUUID()
        const cents = Math.round(d.currentAmount * 100)

        const { data: prev, error: getErr } = await supabase
          .from("account")
          .select("*")
          .eq("id", id)
          .maybeSingle()

        if (getErr && (getErr as any).code !== "PGRST116") {
          throw getErr
        }

        let balance_changed_manually: string | null = prev?.balance_changed_manually ?? null

        if (!prev) {
          balance_changed_manually = now
        } else if (prev.current_amount_cents !== cents) {
          balance_changed_manually = now
        }

        const row: AccountRow = {
          id,
          name: d.name.trim(),
          color_hex: d.colorHex,
          description: d.description?.trim() ?? null,
          current_amount_cents: cents,
          balance_changed_manually,
          created_at: prev?.created_at ?? now,
          updated_at: now,
        }

        const { error: upsertErr } = await supabase
          .from("account")
          .upsert(row, { onConflict: "id" })

        if (upsertErr) throw upsertErr

        return { ok: true, id }
      }
    )
  },

  async delete(id: string) {
    return useEmitStatus(
      {
        scope: "accounts",
        action: "delete",
        successMessage: "Account deleted",
        errorMessage: "Account deletion failed",
      },
      async () => {
        const { error } = await supabase
          .from("account")
          .delete()
          .eq("id", id)

        if (error) throw error
        return { ok: true }
      }
    )
  },
}
