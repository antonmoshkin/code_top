import { useState, useEffect, useMemo } from "react"
import { 
  Button,
  Badge,
  Input,
  Popover
} from "@medusajs/ui"
import { ChevronDownMini } from "@medusajs/icons"

interface Variant {
  id: string
  title: string
  sku?: string
  product_id: string
  product_title: string
  display_name: string
}

interface ProductVariantSelectorProps {
  value: Variant | null
  onChange: (variant: Variant | null) => void
  placeholder?: string
  t?: (key: any) => string // Translation function (accepting any key for flexibility)
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  value,
  onChange,
  placeholder = "Select a variant...",
  t = (key: any) => key // Default fallback
}) => {
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Debounced search function
  const fetchVariants = useMemo(() => {
    let timeoutId: NodeJS.Timeout

    return (query: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        try {
          setLoading(true)
          const params = new URLSearchParams()
          if (query) {
            params.set("q", query)
          }
          params.set("limit", "50")

          const response = await fetch(`/admin/activation-keys/variants?${params}`, {
            credentials: "include"
          })

          if (!response.ok) {
            throw new Error("Failed to fetch variants")
          }

          const data = await response.json()
          setVariants(data.variants || [])
        } catch (error) {
          console.error("Error fetching variants:", error)
          setVariants([])
        } finally {
          setLoading(false)
        }
      }, 300)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchVariants("")
  }, [fetchVariants])

  // Search when query changes
  useEffect(() => {
    fetchVariants(searchQuery)
  }, [searchQuery, fetchVariants])

  const handleSelect = (variant: Variant) => {
    onChange(variant)
  }

  return (
    <Popover>
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="truncate">{value.display_name}</span>
              {value.sku && (
                <Badge size="2xsmall">
                  {value.sku}
                </Badge>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDownMini className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[400px] p-4" align="start">
        <div className="space-y-2">
          <Input
            placeholder={t('searchProductsAndVariants') || "Search products and variants..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading ? (
              <div className="py-6 text-center text-sm">
                {t('searchingVariants') || "Searching variants..."}
              </div>
            ) : variants.length === 0 ? (
              <div className="py-6 text-center text-sm text-ui-fg-subtle">
                {t('noVariantsFound') || "No variants found."}
              </div>
            ) : (
              variants.map((variant) => (
                <div
                  key={variant.id}
                  className="p-2 hover:bg-ui-bg-subtle rounded cursor-pointer"
                  onClick={() => handleSelect(variant)}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {variant.product_title}
                      </span>
                      {variant.title && variant.title !== "Default" && (
                        <span className="text-sm text-ui-fg-subtle">
                          - {variant.title}
                        </span>
                      )}
                    </div>
                    {variant.sku && (
                      <div className="flex items-center gap-1">
                        <Badge size="2xsmall">
                          SKU: {variant.sku}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Popover.Content>
    </Popover>
  )
}