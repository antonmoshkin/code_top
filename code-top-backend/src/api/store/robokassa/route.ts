import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ROBOKASSA_MODULE } from "../../../modules/robokassa"
import RobokassaModuleService from "../../../modules/robokassa/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { amount, currency_code, description, email } = req.body || {}

    if (
      typeof amount !== "number" ||
      !currency_code ||
      typeof currency_code !== "string" ||
      !description ||
      typeof description !== "string" ||
      !email ||
      typeof email !== "string"
    ) {
      return res.status(400).json({
        message:
          "Invalid body. Expected { amount: number, currency_code: string, description: string, email: string }",
      })
    }

    const robokassaService: RobokassaModuleService = req.scope.resolve(
      ROBOKASSA_MODULE
    )

    const payment = await robokassaService.initiatePayment({
      amount,
      currency_code,
      description,
      email,
    })

    const redirectUrl = payment?.data?.redirectUrl
    if (!redirectUrl) {
      return res.status(500).json({ message: "Failed to obtain redirectUrl" })
    }

    return res.status(200).json({ redirectUrl })
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Internal Server Error" })
  }
}







