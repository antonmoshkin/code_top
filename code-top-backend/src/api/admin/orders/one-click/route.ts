import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import oneClickOrderWorkflow from "../../../../workflows/one-click-order"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const { result } = await oneClickOrderWorkflow(req.scope).run({
      input: {
        email: req.body?.email,
        region_id: req.body?.region_id,
      },
    })

    return res.status(200).json({ order_id: result.order_id })
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to create one-click order" })
  }
}



