import type { CategoriesApi } from "../types"
import { supabase } from "../supaBase.client"
import type { CategoryRow } from "../../Electron/types"
import { useEmitStatus } from "../statusListener"

export const categoriesApi: CategoriesApi = {
  async list() {
    return useEmitStatus(
      {
        scope: "categories",
        action: "list",
        errorMessage: "Categories listing failed",
        emitSuccess: false,
      },
      async () => {
        const { data, error } = await supabase
          .from("category")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error
        return (data ?? []) as CategoryRow[]
      }
    )
  },

  async upsert(d) {
    const isNew = !d.id

    return useEmitStatus(
      {
        scope: "categories",
        action: "upsert",
        successMessage: isNew ? "Category created" : "Category updated",
        errorMessage: "Category save failed",
      },
      async () => {
        const now = new Date().toISOString()
        const id = d.id ?? crypto.randomUUID()

        const { data: existing, error: getErr } = await supabase
          .from("category")
          .select("*")
          .eq("id", id)
          .maybeSingle()

        if (getErr && (getErr as any).code !== "PGRST116") {
          throw getErr
        }

        const row: CategoryRow = {
          id,
          name: d.name.trim(),
          color_hex: d.colorHex ?? null,
          created_at: existing?.created_at ?? now,
          updated_at: now,
        }

        const { error: upsertErr } = await supabase
          .from("category")
          .upsert(row, { onConflict: "id" })

        if (upsertErr) throw upsertErr

        return { ok: true, id }
      }
    )
  },

  async delete(id: string) {
    return useEmitStatus(
      {
        scope: "categories",
        action: "delete",
        successMessage: "Category deleted",
        errorMessage: "Category deletion failed",
      },
      async () => {
        const { error } = await supabase
          .from("category")
          .delete()
          .eq("id", id)

        if (error) throw error
        return { ok: true }
      }
    )
  },
}
