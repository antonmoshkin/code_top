import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Key, Plus, Trash } from "@medusajs/icons"
import { 
  Container, 
  Heading, 
  Button, 
  Table, 
  Badge,
  Text,
  toast,
  Drawer,
  Input,
  Label
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import { ProductVariantSelector, BulkKeyImport } from "./components"
import { useTranslation, getBrowserLanguage, type Language } from "../../utils/translations"

interface ActivationKey {
  id: string
  key: string
  product_variant_id: string
  is_used: boolean
  cost?: number
  created_by?: string
  created_at: string
  updated_at: string
  product_title?: string
  variant_title?: string
  variant_sku?: string
  variant?: {
    id: string
    title: string
    sku?: string
    product: {
      title: string
    }
  }
}

interface Variant {
  id: string
  title: string
  sku?: string
  product_id: string
  product_title: string
  display_name: string
}

const ActivationKeysPage = () => {
  const [language, setLanguage] = useState<Language>(() => getBrowserLanguage())
  const { t } = useTranslation(language)
  
  const [activationKeys, setActivationKeys] = useState<ActivationKey[]>([])
  const [loading, setLoading] = useState(true)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [newKey, setNewKey] = useState("")
  const [newCost, setNewCost] = useState("")
  const [submitting, setSubmitting] = useState(false)
  // Filters & sorting
  const [filterVariant, setFilterVariant] = useState<Variant | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterIsUsed, setFilterIsUsed] = useState<string>("") // "", "true", "false"
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  const [pageSize, setPageSize] = useState<number>(25)
  const [page, setPage] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)

  // Initialize filters from URL (e.g., /app/activation-keys?product_variant_id=...)
  useEffect(() => {
    try {
      const search = typeof window !== "undefined" ? window.location.search : ""
      const urlParams = new URLSearchParams(search)
      const variantId = urlParams.get("product_variant_id")
      if (variantId) {
        setFilterVariant({
          id: variantId,
          title: "",
          sku: undefined,
          product_id: "",
          product_title: "",
          display_name: "Selected variant",
        })
        setPage(1)
        // Trigger initial fetch using the preset filter (pass override to avoid race with state update)
        fetchActivationKeys({ overrideVariantId: variantId })
      }
    } catch {
      // ignore parsing errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch activation keys
  const fetchActivationKeys = async (opts?: { overrideVariantId?: string }) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      const variantIdToUse = opts?.overrideVariantId ?? filterVariant?.id
      if (variantIdToUse) params.set("product_variant_id", variantIdToUse)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())
      if (filterIsUsed !== "") params.set("is_used", filterIsUsed)
      if (sortBy) params.set("sort", sortBy)
      if (sortOrder) params.set("order", sortOrder)

      params.set("limit", String(pageSize))
      params.set("offset", String((page - 1) * pageSize))
      const url = `/admin/activation-keys-simple${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url, {
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch activation keys")
      }
      
      const data = await response.json()
      setActivationKeys(data.activation_keys || [])
      if (typeof data.total === 'number') setTotal(data.total)
    } catch (error) {
      console.error("Error fetching activation keys:", error)
      toast.error(t('failedToLoadActivationKeys'))
    } finally {
      setLoading(false)
    }
  }

  // Add single key
  const handleAddKey = async () => {
    if (!selectedVariant || !newKey.trim()) {
      toast.error(t('pleaseSelectVariantAndEnterKey'))
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/admin/activation-keys-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          product_variant_id: selectedVariant.id,
          keys: newKey.trim(),
          ...(newCost.trim() ? { cost: Number(newCost) } : {})
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add activation key")
      }

      toast.success(t('activationKeyAddedSuccessfully'))
      setAddDrawerOpen(false)
      setNewKey("")
      setNewCost("")
      setSelectedVariant(null)
      await fetchActivationKeys()
    } catch (error) {
      console.error("Error adding activation key:", error)
      toast.error(error instanceof Error ? error.message : t('failedToAddActivationKey'))
    } finally {
      setSubmitting(false)
    }
  }

  // Delete key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm(t('confirmDeleteActivationKey'))) {
      return
    }

    try {
      const response = await fetch(`/admin/activation-keys-simple?id=${keyId}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete activation key")
      }

      toast.success(t('activationKeyDeletedSuccessfully'))
      await fetchActivationKeys()
    } catch (error) {
      console.error("Error deleting activation key:", error)
      toast.error(error instanceof Error ? error.message : t('failedToDeleteActivationKey'))
    }
  }

  // Handle bulk import success
  const handleBulkImportSuccess = () => {
    setBulkDrawerOpen(false)
    fetchActivationKeys()
  }

  useEffect(() => {
    fetchActivationKeys()
  }, [page, pageSize])

  const formatDate = (dateString: string) => {
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Container className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t('activationKeys')}</Heading>
          <Text className="text-ui-fg-subtle">
            {t('manageActivationKeys')}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="transparent"
            size="small"
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            className="text-ui-fg-subtle hover:text-ui-fg-base"
          >
            {language === 'en' ? '🇷🇺 RU' : '🇺🇸 EN'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setBulkDrawerOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('bulkImport')}
          </Button>
          <Button onClick={() => setAddDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addKey')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 grid gap-3 md:grid-cols-12 grid-cols-1">
        <div className="md:col-span-3">
          <Label htmlFor="search">{t('search')}</Label>
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchProductsAndVariants')}
          />
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="variant-filter">{t('variantFilter')}</Label>
          <ProductVariantSelector
            value={filterVariant}
            onChange={setFilterVariant}
            placeholder={t('searchProductVariant')}
            t={t}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="status-filter">{t('filterStatus')}</Label>
          <select
            id="status-filter"
            value={filterIsUsed}
            onChange={(e) => setFilterIsUsed(e.target.value)}
            className="w-full h-9 rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-ui-fg-base text-xs"
          >
            <option value="">{t('all')}</option>
            <option value="false">{t('available')}</option>
            <option value="true">{t('used')}</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="sort-by">{t('sortBy')}</Label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full h-9 rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-ui-fg-base text-xs"
          >
            <option value="created_at">{t('created')}</option>
            <option value="key">{t('key')}</option>
            <option value="product_title">{t('product')}</option>
            <option value="variant_title">{t('variant')}</option>
            <option value="variant_sku">{t('sku')}</option>
            <option value="is_used">{t('status')}</option>
            <option value="used_at">{t('usedAt')}</option>
            <option value="updated_at">{t('updated')}</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="sort-order">{t('order')}</Label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full h-9 rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-ui-fg-base text-xs"
          >
            <option value="asc">{t('ascending')}</option>
            <option value="desc">{t('descending')}</option>
          </select>
        </div>
        <div className="md:col-span-12 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setSearchQuery(""); setFilterVariant(null); setFilterIsUsed(""); setSortBy("created_at"); setSortOrder("desc"); setPage(1); fetchActivationKeys() }}>{t('clear')}</Button>
            <Button onClick={() => { setPage(1); fetchActivationKeys() }}>{t('apply')}</Button>
        </div>
      </div>

      {/* Table */}
      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Text>{t('loadingActivationKeys')}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('key')}</Table.HeaderCell>
                <Table.HeaderCell>{t('product')}</Table.HeaderCell>
                <Table.HeaderCell>{t('variant')}</Table.HeaderCell>
                <Table.HeaderCell>{t('sku')}</Table.HeaderCell>
                <Table.HeaderCell>{t('cost')}</Table.HeaderCell>
                <Table.HeaderCell>{t('createdBy')}</Table.HeaderCell>
                <Table.HeaderCell>{t('status')}</Table.HeaderCell>
                <Table.HeaderCell>{t('created')}</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {activationKeys.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-center py-8">
                    <Text className="text-ui-fg-subtle">
                      {t('noActivationKeysFound')}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                activationKeys.map((key) => (
                  <Table.Row key={key.id}>
                    <Table.Cell>
                      <Text className="font-mono text-sm">
                        {key.key.length > 20 ? `${key.key.substring(0, 20)}...` : key.key}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{key.product_title || key.variant?.product?.title || t('unknownProduct')}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{key.variant_title || key.variant?.title || t('defaultVariant')}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-mono text-sm">
                        {key.variant_sku || key.variant?.sku || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-mono text-sm">
                        {typeof key.cost === 'number' ? key.cost.toFixed(2) : '-'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-sm">
                        {key.created_by || '-'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={key.is_used ? "red" : "green"}>
                        {key.is_used ? t('used') : t('available')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-sm text-ui-fg-subtle">
                        {formatDate(key.created_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-ui-fg-error hover:text-ui-fg-error"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Pagination footer */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Text className="text-ui-fg-subtle">
            {t('showing')} {activationKeys.length > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} {t('of')} {total}
          </Text>
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size-footer">{t('perPage')}</Label>
            <select
              id="page-size-footer"
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)) }}
              className="h-9 rounded-md border border-ui-border-base bg-ui-bg-base px-2 text-ui-fg-base"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('prev')}
          </Button>
          <Button
            variant="secondary"
            disabled={(page * pageSize) >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('next')}
          </Button>
        </div>
      </div>

      {/* Add Key Drawer */}
      <Drawer open={addDrawerOpen} onOpenChange={setAddDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{t('addActivationKey')}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="space-y-4">
            <div>
              <Label htmlFor="variant">{t('productVariant')}</Label>
              <ProductVariantSelector
                value={selectedVariant}
                onChange={setSelectedVariant}
                placeholder={t('searchProductVariant')}
                t={t}
              />
            </div>
            <div>
              <Label htmlFor="key">{t('activationKey')}</Label>
              <Input
                id="key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={t('enterActivationKey')}
              />
            </div>
            <div>
              <Label htmlFor="cost">{t('cost')}</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">{t('cancel')}</Button>
            </Drawer.Close>
            <Button 
              onClick={handleAddKey} 
              disabled={submitting || !selectedVariant || !newKey.trim()}
            >
              {submitting ? t('adding') : t('addKey')}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      {/* Bulk Import Drawer */}
      <Drawer open={bulkDrawerOpen} onOpenChange={setBulkDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{t('bulkImportActivationKeys')}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <BulkKeyImport onSuccess={handleBulkImportSuccess} />
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Activation Keys",
  icon: Key,
})

export default ActivationKeysPage