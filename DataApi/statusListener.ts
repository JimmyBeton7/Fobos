import type { OperationStatus } from "../Electron/types"

export type StatusListener = (s: OperationStatus) => void

let listener: StatusListener | null = null

export function setStatusListener(fn: StatusListener | null) {
  listener = fn
}

type EmitStatusInput = Omit<OperationStatus, "id" | "ts">

export function emitStatus(input: EmitStatusInput) {
  if (!listener) return
  listener({
    id: crypto.randomUUID(),
    ts: Date.now(),
    ...input,
  })
}

function errMsg(err: unknown) {
  if (!err) return "Unknown error"
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message
  const anyErr = err as any
  return String(anyErr?.message ?? "Unknown error")
}

export async function useEmitStatus<T>(
  p: {
    scope: OperationStatus["scope"]
    action: OperationStatus["action"]
    errorMessage: string
    successMessage?: string
    emitSuccess?: boolean
  },
  fn: () => Promise<T>
): Promise<T> {
  try {
    const res = await fn()
    if (p.emitSuccess !== false && p.successMessage) {
      emitStatus({
        scope: p.scope,
        action: p.action,
        state: "success",
        message: p.successMessage,
      })
    }
    return res
  } catch (err) {
    emitStatus({
      scope: p.scope,
      action: p.action,
      state: "error",
      message: `${p.errorMessage}: ${errMsg(err)}`,
      detail: err,
    })
    throw err
  }
}
