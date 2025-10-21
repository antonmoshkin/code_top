import { useState } from "react"
import { 
  Button, 
  Textarea, 
  Label, 
  Text,
  toast,
  Alert
} from "@medusajs/ui"
import { ProductVariantSelector } from "./product-variant-selector"

interface Variant {
  id: string
  title: string
  sku?: string
  product_id: string
  product_title: string
  display_name: string
}

interface BulkKeyImportProps {
  onSuccess: () => void
}

export const BulkKeyImport: React.FC<BulkKeyImportProps> = ({ onSuccess }) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [keysText, setKeysText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedVariant) {
      toast.error("Please select a product variant")
      return
    }

    if (!keysText.trim()) {
      toast.error("Please enter activation keys")
      return
    }

    // Parse keys from text (split by lines, filter empty lines)
    const keys = keysText
      .split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0)

    if (keys.length === 0) {
      toast.error("No valid activation keys found")
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
          keys: keys
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to import activation keys")
      }

      toast.success(`Successfully imported ${keys.length} activation key${keys.length > 1 ? 's' : ''}`)
      
      // Reset form
      setSelectedVariant(null)
      setKeysText("")
      onSuccess()
      
    } catch (error) {
      console.error("Error importing activation keys:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import activation keys")
    } finally {
      setSubmitting(false)
    }
  }

  // Parse preview keys
  const previewKeys = keysText
    .split('\n')
    .map(key => key.trim())
    .filter(key => key.length > 0)

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="variant">Product Variant</Label>
        <ProductVariantSelector
          value={selectedVariant}
          onChange={setSelectedVariant}
          placeholder="Search for a product variant..."
        />
      </div>

      <div>
        <Label htmlFor="keys">Activation Keys</Label>
        <Text className="text-sm text-ui-fg-subtle mb-2">
          Enter each activation key on a separate line. Empty lines will be ignored.
        </Text>
        <Textarea
          id="keys"
          value={keysText}
          onChange={(e) => setKeysText(e.target.value)}
          placeholder={`ABCD-EFGH-1234-5678
IJKL-MNOP-9012-3456
QRST-UVWX-7890-1234`}
          rows={8}
          className="font-mono"
        />
      </div>

      {previewKeys.length > 0 && (
        <Alert>
          <div>
            <Text className="font-medium">Preview</Text>
            <Text className="text-sm text-ui-fg-subtle">
              {previewKeys.length} key{previewKeys.length > 1 ? 's' : ''} will be imported:
            </Text>
            <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {previewKeys.slice(0, 5).map((key, index) => (
                <li key={index} className="text-sm font-mono bg-ui-bg-subtle px-2 py-1 rounded">
                  {key.length > 30 ? `${key.substring(0, 30)}...` : key}
                </li>
              ))}
              {previewKeys.length > 5 && (
                <li className="text-sm text-ui-fg-subtle italic">
                  ... and {previewKeys.length - 5} more
                </li>
              )}
            </ul>
          </div>
        </Alert>
      )}

      <div className="flex gap-2 pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={submitting || !selectedVariant || previewKeys.length === 0}
          className="flex-1"
        >
          {submitting ? "Importing..." : `Import ${previewKeys.length} Key${previewKeys.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  )
}