import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
const { Client } = require('pg')

// Database-persisted API using direct SQL via working product service
// GET /admin/activation-keys-simple - List all activation keys
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("📋 GET /admin/activation-keys-simple - Fetching activation keys from database")

    const {
      id,
      key,
      product_variant_id,
      is_used,
      order_id,
      used_at,
      cost,
      created_by,
      created_at,
      updated_at,
      q,
      sort = "created_at",
      order = "desc",
      limit = "100",
      offset = "0",
    } = req.query as Record<string, string | undefined>

    // Validate sort and order
    const sortableColumns = new Set([
      "id",
      "key",
      "product_variant_id",
      "is_used",
      "order_id",
      "used_at",
      "created_at",
      "updated_at",
      "cost",
      "created_by",
      // joined columns
      "product_title",
      "variant_title",
      "variant_sku",
    ])

    const sortCol = (sort || "created_at").toString()
    const sortLower = sortCol.toLowerCase()
    const orderLower = (order || "desc").toString().toLowerCase() === "asc" ? "ASC" : "DESC"
    const orderBy = sortableColumns.has(sortLower) ? sortLower : "created_at"

    // Use direct database connection (bypassing container issues)
    const client = await getDbConnection()

    try {
      const whereClauses: string[] = []
      const params: any[] = []

      // Filters by exact match for all table fields
      const addFilter = (column: string, value?: string) => {
        if (value === undefined) return
        const paramIndex = params.length + 1
        whereClauses.push(`${column} = $${paramIndex}`)
        params.push(value)
      }

      addFilter("ak.id", id)
      addFilter("ak.key", key)
      addFilter("ak.product_variant_id", product_variant_id)
      if (typeof is_used !== "undefined") {
        const paramIndex = params.length + 1
        whereClauses.push(`ak.is_used = $${paramIndex}`)
        params.push(is_used === "true" || is_used === "1")
      }
      addFilter("ak.order_id", order_id)
      addFilter("ak.used_at", used_at)
      addFilter("ak.cost", cost)
      addFilter("ak.created_by", created_by)
      addFilter("ak.created_at", created_at)
      addFilter("ak.updated_at", updated_at)

      // Free-text search across key, product/variant titles and sku
      if (q && q.trim()) {
        const idx = params.length + 1
        whereClauses.push(`(
          ak.key ILIKE $${idx} OR
          p.title ILIKE $${idx} OR
          pv.title ILIKE $${idx} OR
          pv.sku ILIKE $${idx}
        )`)
        params.push(`%${q.trim()}%`)
      }

      let baseFrom = `
        SELECT 
          ak.id,
          ak.key,
          ak.product_variant_id,
          ak.is_used,
          ak.order_id,
          ak.used_at,
          ak.cost,
          ak.created_by,
          ak.created_at,
          ak.updated_at,
          p.title AS product_title,
          pv.title AS variant_title,
          pv.sku AS variant_sku
        FROM activation_key ak
        LEFT JOIN product_variant pv ON ak.product_variant_id = pv.id
        LEFT JOIN product p ON pv.product_id = p.id`

      const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(" AND ")}` : ""

      // Total count query (without limit/offset)
      const countSql = `SELECT COUNT(ak.id) AS total FROM activation_key ak
        LEFT JOIN product_variant pv ON ak.product_variant_id = pv.id
        LEFT JOIN product p ON pv.product_id = p.id${whereSql}`

      // Data query
      let sql = `${baseFrom}${whereSql}`

      // Map sort aliases to actual columns
      const sortMapping: Record<string, string> = {
        id: "ak.id",
        key: "ak.key",
        product_variant_id: "ak.product_variant_id",
        is_used: "ak.is_used",
        order_id: "ak.order_id",
        used_at: "ak.used_at",
        cost: "ak.cost",
        created_by: "ak.created_by",
        created_at: "ak.created_at",
        updated_at: "ak.updated_at",
        product_title: "p.title",
        variant_title: "pv.title",
        variant_sku: "pv.sku",
      }

      sql += ` ORDER BY ${sortMapping[orderBy]} ${orderLower}`

      // Compute total BEFORE adding limit/offset to params
      const countParams = [...params]
      console.log("Executing count SQL:", countSql)
      console.log("Count params:", countParams)
      const countResult = await client.query(countSql, countParams)
      const total = parseInt(countResult.rows?.[0]?.total ?? "0", 10)

      const limitNum = Math.max(0, Math.min(1000, parseInt(limit as string, 10) || 100))
      const offsetNum = Math.max(0, parseInt(offset as string, 10) || 0)

      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limitNum, offsetNum)

      console.log("Executing data SQL:", sql)
      console.log("Data params:", params)
      const result = await client.query(sql, params)

      const enrichedKeys = result.rows.map(row => ({
        ...row,
        product_title: row.product_title || "Unknown Product",
        variant_title: row.variant_title || "Default",
        variant_sku: row.variant_sku || "N/A"
      }))

      await client.end()

      return res.json({
        count: enrichedKeys.length,
        total,
        limit: limitNum,
        offset: offsetNum,
        sort: orderBy,
        order: orderLower,
        activation_keys: enrichedKeys
      })
    } catch (dbError) {
      await client.end()
      console.error("❌ Direct database query failed:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("Error fetching activation keys:", error)
    return res.status(500).json({ 
      message: "Failed to fetch activation keys",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// Helper function to get a working database connection
async function getDbConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgres://gen_user:6%5C%3DunsTK_VaS%5Cd@5.129.203.179:5432/code_top"
  });
  await client.connect();
  return client;
}


// POST /admin/activation-keys-simple - Create activation key(s)
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("✏️ POST /admin/activation-keys-simple - Creating activation keys")
    
    const { product_variant_id, keys, cost } = req.body as {
      product_variant_id: string
      keys: string | string[]
      cost?: number
    }

    if (!product_variant_id) {
      return res.status(400).json({
        message: "product_variant_id is required"
      })
    }

    if (!keys || (!Array.isArray(keys) && typeof keys !== 'string')) {
      return res.status(400).json({
        message: "keys must be a string or array of strings"
      })
    }

    console.log("Creating activation keys for variant:", product_variant_id)
    console.log("Keys to create:", keys)

    // Use direct database connection (bypassing container issues)
    console.log("✏️ POST /admin/activation-keys-simple - Using direct DB connection")
    
    const client = await getDbConnection()
    
    try {
      const keysArray = Array.isArray(keys) ? keys : [keys]
      const insertedKeys = []
      
      // capture creator id if available from auth
      const createdBy = (req as any).auth_user_id || (req as any).user?.id || null

      for (let i = 0; i < keysArray.length; i++) {
        const keyValue = keysArray[i]
        const keyId = `ak_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`
        
        const result = await client.query(
          `INSERT INTO activation_key (id, key, product_variant_id, is_used, cost, created_by, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [keyId, keyValue, product_variant_id, false, typeof cost === 'number' ? cost : null, createdBy]
        )
        
        insertedKeys.push(result.rows[0])
        console.log(`✅ Inserted activation key to database: ${keyValue}`)
      }
      
      await client.end()
      
      console.log(`🎉 Successfully saved ${insertedKeys.length} activation key(s) to database!`)
      
      return res.status(201).json({
        activation_keys: insertedKeys
      })
    } catch (dbError) {
      await client.end()
      console.error("❌ Direct database insert failed:", dbError)
      throw dbError
    }
    
    // Fallback to mock data creation
    const keysArray = Array.isArray(keys) ? keys : [keys]
    const mockResult = keysArray.map((key, index) => ({
      id: `ak_mock_${Date.now()}_${index}`,
      key,
      product_variant_id,
      is_used: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    console.log(`⚠️ Created ${mockResult.length} mock activation key(s) (not persisted to database)`)

    res.status(201).json({
      activation_keys: mockResult
    })
  } catch (error) {
    console.error("Error creating activation keys:", error)
    res.status(500).json({ 
      message: "Failed to create activation keys",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// DELETE /admin/activation-keys-simple - Delete activation key
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.query as { id: string }
    
    if (!id) {
      return res.status(400).json({
        message: "Key ID is required"
      })
    }

    console.log(`🗑️ DELETE /admin/activation-keys-simple - Deleting key: ${id}`)
    
    const client = await getDbConnection()
    
    try {
      const result = await client.query(
        'DELETE FROM activation_key WHERE id = $1 RETURNING *',
        [id]
      )
      
      await client.end()
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Activation key not found"
        })
      }
      
      console.log(`✅ Successfully deleted activation key: ${id}`)
      
      return res.status(200).json({
        message: "Activation key deleted successfully"
      })
    } catch (dbError) {
      await client.end()
      console.error("❌ Failed to delete activation key:", dbError)
      throw dbError
    }
    
  } catch (error) {
    console.error("Error deleting activation key:", error)
    res.status(500).json({ 
      message: "Failed to delete activation key",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}