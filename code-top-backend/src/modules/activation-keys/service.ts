import { MedusaService } from "@medusajs/framework/utils"
import ActivationKey from "./models/activation-key"

class ActivationKeyModuleService extends MedusaService({
  ActivationKey,
}){
  constructor(...args: any[]) {
    super(...args)
    console.log("✅ ActivationKeyModuleService initialized")
  }

  // Temporary direct SQL implementation until repository issue is resolved
  private async getManager() {
    try {
      // Try to get the database manager directly
      const manager = (this as any).__container__?.resolve("manager")
      if (!manager) {
        throw new Error("Database manager not available")
      }
      return manager
    } catch (error) {
      throw new Error(`Could not access database manager: ${error.message}`)
    }
  }

  async retrieveUnusedKey(productVariantId: string, orderId?: string): Promise<any> {
    const manager = await this.getManager()
    
    const result = await manager.query(
      'SELECT * FROM activation_key WHERE product_variant_id = $1 AND is_used = false LIMIT 1',
      [productVariantId]
    )
    
    if (result.length > 0) {
      const key = result[0]
      await manager.query(
        'UPDATE activation_key SET is_used = true, order_id = $1, used_at = NOW() WHERE id = $2',
        [orderId || null, key.id]
      )
      return { ...key, order_id: orderId, used_at: new Date() }
    }
    
    return null
  }

  async listKeysForOrder(orderId: string): Promise<any[]> {
    const manager = await this.getManager()
    
    const result = await manager.query(
      'SELECT * FROM activation_key WHERE order_id = $1 ORDER BY used_at ASC',
      [orderId]
    )
    
    return result
  }

  async listKeysForVariant(productVariantId: string): Promise<any[]> {
    const manager = await this.getManager()
    
    const result = await manager.query(
      'SELECT * FROM activation_key WHERE product_variant_id = $1 ORDER BY id ASC',
      [productVariantId]
    )
    
    return result
  }

  async listAllKeys(): Promise<any[]> {
    const manager = await this.getManager()
    
    const result = await manager.query(
      'SELECT * FROM activation_key ORDER BY product_variant_id ASC, id ASC'
    )
    
    return result
  }

  async addKey(productVariantId: string, key: string): Promise<any> {
    const manager = await this.getManager()
    
    console.log("Creating activation key:", { productVariantId, key: key.substring(0, 10) + '...' })
    
    const result = await manager.query(
      'INSERT INTO activation_key (id, key, product_variant_id, is_used, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, false, NOW(), NOW()) RETURNING *',
      [key, productVariantId]
    )
    
    console.log("✅ Activation key created successfully")
    return result[0]
  }

  async addMultipleKeys(productVariantId: string, keys: string[]): Promise<any[]> {
    const manager = await this.getManager()
    
    const results: any[] = []
    for (const key of keys) {
      const result = await manager.query(
        'INSERT INTO activation_key (id, key, product_variant_id, is_used, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, false, NOW(), NOW()) RETURNING *',
        [key, productVariantId]
      )
      results.push(result[0])
    }
    
    return results
  }

  async deleteKey(keyId: string): Promise<void> {
    const manager = await this.getManager()
    
    await manager.query(
      'DELETE FROM activation_key WHERE id = $1',
      [keyId]
    )
  }

  async deleteKeysForVariant(productVariantId: string): Promise<void> {
    const manager = await this.getManager()
    
    await manager.query(
      'DELETE FROM activation_key WHERE product_variant_id = $1',
      [productVariantId]
    )
  }
}

export default ActivationKeyModuleService

