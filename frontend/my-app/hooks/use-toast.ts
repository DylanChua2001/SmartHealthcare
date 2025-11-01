"use client"

import { useCallback } from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastEventDetail extends ToastOptions {
  id: string
  variant: ToastVariant
  createdAt: number
}

export const TOAST_EVENT = "app:toast"
const DEFAULT_DURATION = 4000

/**
 * Emits toast events that are handled globally by the Toaster component.
 */
export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    if (typeof window === "undefined") {
      return
    }

    const detail: ToastEventDetail = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
      duration: options.duration ?? DEFAULT_DURATION,
      createdAt: Date.now(),
    }

    window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }))
  }, [])

  return { toast }
}

