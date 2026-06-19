"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Toast } from "@/components/ui/toast"
import { deletePurchaseOrderAction } from "@/app/actions/purchase.actions"

type DeleteOrderSectionProps = {
  purchaseOrderId: string
}

export function DeleteOrderSection({ purchaseOrderId }: DeleteOrderSectionProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deletePurchaseOrderAction(purchaseOrderId)
    if (result.success) {
      setToast({ message: "Orden de compra eliminada correctamente.", variant: "success" })
      setTimeout(() => {
        router.push("/purchases")
      }, 1500)
    } else {
      setToast({ message: result.error ?? "Error al eliminar la orden.", variant: "error" })
      setIsDeleting(false)
    }
    setShowConfirm(false)
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="cursor-pointer"
      >
        <Trash2 className="size-4" />
        Eliminar orden
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title="Eliminar orden de compra"
        message="¿Estás seguro de eliminar esta orden? Los productos quedarán disponibles para nuevas órdenes. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
