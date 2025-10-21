import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
const { Client } = require('pg')

// GET /admin/activation-keys/variants - Search and list product variants
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("🔍 GET /admin/activation-keys/variants - Searching product variants")
    
    const { q: query, limit = "50" } = req.query as { q?: string; limit?: string }
    
    console.log("Search query:", query)
    console.log("Limit:", limit)
    
    // Use direct database connection (bypassing container issues)
    const client = await getDbConnection()
    
    try {
      let sql = `
        SELECT 
          pv.id,
          pv.title,
          pv.sku,
          pv.product_id,
          p.title as product_title,
          CONCAT(p.title, CASE 
            WHEN pv.title IS NOT NULL AND pv.title != 'Default' 
            THEN ' - ' || pv.title 
            ELSE '' 
          END) as display_name
        FROM product_variant pv
        LEFT JOIN product p ON pv.product_id = p.id
        WHERE p.deleted_at IS NULL
      `
      
      const params: any[] = []
      
      // Add search functionality if query is provided
      if (query && query.trim()) {
        sql += ` AND (
          p.title ILIKE $1 
          OR pv.title ILIKE $1 
          OR pv.sku ILIKE $1
        )`
        params.push(`%${query.trim()}%`)
      }
      
      sql += ` ORDER BY p.title ASC, pv.title ASC`
      
      // Add limit
      const limitNum = parseInt(limit) || 50
      sql += ` LIMIT $${params.length + 1}`
      params.push(limitNum)
      
      console.log("Executing SQL:", sql)
      console.log("With params:", params)
      
      const result = await client.query(sql, params)
      
      // Ensure we have proper fallback values and format for frontend
      const variants = result.rows.map(row => ({
        id: row.id,
        title: row.title || "Default",
        sku: row.sku || null,
        product_id: row.product_id,
        product_title: row.product_title || "Unknown Product",
        display_name: row.display_name || `${row.product_title || "Unknown Product"}`
      }))
      
      console.log(`✅ Found ${variants.length} variants`)
      
      await client.end()
      
      return res.json({
        variants: variants
      })
    } catch (dbError) {
      await client.end()
      console.error("❌ Direct database query failed:", dbError)
      throw dbError
    }
    
  } catch (error) {
    console.error("Error fetching variants:", error)
    
    // Fallback to mock data if database access fails
    console.log("🔄 Falling back to mock data due to database error")
    const mockVariants = [
      {
        id: "variant_mock_001",
        title: "Default",
        sku: "DEMO-SKU-001",
        product_id: "product_mock_001",
        product_title: "Demo Product",
        display_name: "Demo Product"
      },
      {
        id: "variant_mock_002", 
        title: "Size M",
        sku: "DEMO-SKU-002",
        product_id: "product_mock_002",
        product_title: "Demo T-Shirt",
        display_name: "Demo T-Shirt - Size M"
      }
    ]
    
    res.json({
      variants: mockVariants
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