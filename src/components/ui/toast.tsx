"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info"

type ToastProps = {
  message: string
  variant?: ToastVariant
  duration?: number
  onClose?: () => void
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
}

export function Toast({
  message,
  variant = "success",
  duration = 4000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const show = setTimeout(() => setVisible(true), 0)
    const hide = setTimeout(() => {
      setVisible(false)
    }, duration)
    const cleanup = setTimeout(() => {
      onClose?.()
    }, duration + 300)

    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      clearTimeout(cleanup)
    }
  }, [duration, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all duration-300",
        variantStyles[variant],
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-[120%] opacity-0",
      )}
    >
      <span className="font-medium">{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onClose?.(), 300)
        }}
        className="ml-2 shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
