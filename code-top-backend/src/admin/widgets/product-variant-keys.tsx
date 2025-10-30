import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import React, { useEffect, useMemo, useState } from "react"

type AdminProductVariant = {
  id: string
  title: string | null
  sku?: string | null
}

type AdminProduct = {
  id: string
  title?: string | null
  variants?: AdminProductVariant[]
}

type KeysCountResponse = {
  total?: number
}

const ProductVariantKeysWidget: React.FC = () => {
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variantIdToCount, setVariantIdToCount] = useState<Record<string, number>>({})

  const { productId, adminPrefix } = useMemo(() => {
    // Extract product id and admin prefix from current admin URL, e.g. /a/products/:id or /app/products/:id
    try {
      const path = typeof window !== "undefined" ? window.location.pathname : ""
      const match = path.match(/^\/(\w+)\/products\/([^\/]+)/)
      return {
        adminPrefix: match?.[1] || "a",
        productId: match?.[2] || null,
      }
    } catch {
      return { productId: null as string | null, adminPrefix: "a" }
    }
  }, [])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/admin/products/${productId}`, {
          credentials: "include",
        })
        if (!res.ok) {
          throw new Error("Не удалось загрузить товар")
        }
        const data = await res.json()
        // The Admin product endpoint usually wraps the product under "product"
        const prod: AdminProduct = data.product ?? data
        setProduct({
          id: prod.id,
          title: prod.title ?? null,
          variants: Array.isArray(prod.variants) ? prod.variants : [],
        })
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки товара")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  useEffect(() => {
    const fetchCounts = async () => {
      if (!product?.variants?.length) return
      try {
        const results = await Promise.all(
          product.variants.map(async (v) => {
            const params = new URLSearchParams()
            params.set("product_variant_id", v.id)
            // limit/offset don't affect total count in our implementation
            params.set("limit", "1")
            params.set("offset", "0")
            const res = await fetch(`/admin/activation-keys-simple?${params.toString()}`, {
              credentials: "include",
            })
            if (!res.ok) {
              return { id: v.id, total: 0 }
            }
            const data: KeysCountResponse = await res.json()
            return { id: v.id, total: typeof data.total === "number" ? data.total : 0 }
          })
        )

        const mapping: Record<string, number> = {}
        for (const r of results) {
          mapping[r.id] = r.total
        }
        setVariantIdToCount(mapping)
      } catch {
        // Ignore silently; keep counts empty
      }
    }

    fetchCounts()
  }, [product?.variants])

  if (!productId) {
    return null
  }

  return (
    <Container>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Heading level="h2">Ключи активации по вариациям</Heading>
        {product?.title ? (
          <Text className="text-ui-fg-subtle">{product.title}</Text>
        ) : null}
      </div>

      {error ? (
        <Text className="text-ui-fg-error">{error}</Text>
      ) : loading ? (
        <Text className="text-ui-fg-subtle">Загрузка…</Text>
      ) : !product?.variants?.length ? (
        <Text className="text-ui-fg-subtle">У товара нет вариаций</Text>
      ) : (
        <div className="flex flex-col gap-3">
          {product.variants!.map((v) => {
            const count = variantIdToCount[v.id] ?? 0
            return (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border border-ui-border-base p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge color={count > 0 ? "green" : "red"}>
                    {count}
                  </Badge>
                  <div className="flex flex-col min-w-0">
                    <Text weight="plus" className="truncate">
                      {v.title || "Вариация"}
                    </Text>
                    {v.sku ? (
                      <Text size="small" className="text-ui-fg-subtle truncate">
                        SKU: {v.sku}
                      </Text>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/${adminPrefix}/activation-keys?product_variant_id=${encodeURIComponent(v.id)}`}
                    target="_self"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary">Редактировать ключи</Button>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  // Place after product details on the product page
  zone: "product.details.after",
})

export default ProductVariantKeysWidget


