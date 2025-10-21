import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as crypto from "crypto"
import { ROBOKASSA_MODULE } from "../../modules/robokassa"
import RobokassaModuleService from "../../modules/robokassa/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    OutSum,
    InvId,
    SignatureValue,
  } = req.body

  const robokassaService: RobokassaModuleService = req.scope.resolve(ROBOKASSA_MODULE)

  // Validate signature (assuming Password2 for validation)
  const signature = crypto.createHash("md5").update(
    `${OutSum}:${InvId}:${robokassaService.robokassa_password2}`
  ).digest("hex")

  if (signature.toLowerCase() !== SignatureValue.toLowerCase()) {
    console.error("Robokassa callback: Invalid signature")
    return res.status(400).send("Invalid Signature")
  }

  // Process successful payment
  console.log(`Robokassa callback: Payment successful for InvId: ${InvId}, OutSum: ${OutSum}`)

  // Here, you would typically update the order status in Medusa.js
  // Example: You might need to retrieve the order based on InvId and update its payment status.
  // This would involve interacting with Medusa's order service.

  res.send(`OK${InvId}`)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Robokassa might also send success/fail redirects via GET
  // In a real application, you'd likely want to redirect the user to an order confirmation page.
  console.log("Robokassa GET callback received", req.query)
  res.send("Thank you for your payment!")
}
