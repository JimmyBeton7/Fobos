import { useEffect, useRef } from "react"
import { Toast } from "primereact/toast"
import type { OperationStatus } from "Electron/types"
import { useData } from "./DataContext"

function mapSeverity(state: OperationStatus["state"]) {
  return state === "success" ? "success" : "error"
}

export default function GlobalToast() {
  const toastRef = useRef<Toast>(null)
  const { lastStatus, clearLastStatus } = useData()

  useEffect(() => {
    if (!lastStatus) return

    toastRef.current?.show({
      severity: mapSeverity(lastStatus.state),
      summary: lastStatus.state === "success" ? "Success" : "Error",
      detail: lastStatus.message,
      life: lastStatus.state === "success" ? 2000 : 5000,
    })

    clearLastStatus()
  }, [lastStatus, clearLastStatus])

  return <Toast ref={toastRef} position="top-right" />
}
