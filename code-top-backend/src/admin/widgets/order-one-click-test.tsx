import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, toast } from "@medusajs/ui"
import { useState } from "react"

const OneClickOrderButton = () => {
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    try {
      setLoading(true)
      const res = await fetch("/admin/orders/one-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || "Failed to create order")
      }
      const data = await res.json()
      toast.success(`One-click order created: ${data.order_id}`)
    } catch (e: any) {
      toast.error(e?.message || "Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end w-full">
      <Button onClick={handleCreate} disabled={loading} variant="secondary">
        {loading ? "Создание..." : "Создать заказ в 1 клик"}
      </Button>
    </div>
  )
}

export const config = defineWidgetConfig({
  // Place in orders list header toolbar if available; otherwise orders.details.after as fallback
  zone: "orders.list.before",
})

export default OneClickOrderButton



