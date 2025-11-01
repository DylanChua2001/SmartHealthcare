"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { TOAST_EVENT, type ToastEventDetail } from "@/hooks/use-toast"

const baseContainer =
  "pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:top-6 sm:right-6"
const toastBase =
  "pointer-events-auto w-full overflow-hidden rounded-lg border border-border bg-background p-4 shadow-lg transition-all duration-200"
const variantStyles: Record<ToastEventDetail["variant"], string> = {
  default: "",
  destructive: "border-destructive bg-destructive text-destructive-foreground",
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEventDetail[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastEventDetail>
      const detail = customEvent.detail
      if (!detail) return

      setToasts((prev) => [...prev, detail])

      const duration = detail.duration ?? 4000
      if (duration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== detail.id))
        }, duration)
      }
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [])

  if (!toasts.length) {
    return null
  }

  return (
    <div className={baseContainer} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn(toastBase, variantStyles[toast.variant])} role="status">
          {toast.title && <p className="text-sm font-medium">{toast.title}</p>}
          {toast.description && <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>}
        </div>
      ))}
    </div>
  )
}

