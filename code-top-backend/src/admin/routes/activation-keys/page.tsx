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
  const [submitting, setSubmitting] = useState(false)

  // Fetch activation keys
  const fetchActivationKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch("/admin/activation-keys-simple", {
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch activation keys")
      }
      
      const data = await response.json()
      setActivationKeys(data.activation_keys || [])
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
          keys: newKey.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add activation key")
      }

      toast.success(t('activationKeyAddedSuccessfully'))
      setAddDrawerOpen(false)
      setNewKey("")
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
  }, [])

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
    <Container className="divide-y p-0">
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