import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { ACTIVATION_KEY_MODULE } from "../modules/activation-keys"
import ActivationKeyModuleService from "../modules/activation-keys/service"

export default async function orderPaymentCapturedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id

  // Resolve services
  const orderModuleService = container.resolve(Modules.ORDER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const activationKeyModuleService: ActivationKeyModuleService = container.resolve(ACTIVATION_KEY_MODULE)
  
  try {
    // Retrieve order with line items
    const order = await orderModuleService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "billing_address"]
    })

    console.log(`Processing payment captured for order ${orderId}...`)

    const activationKeys: Array<{
      key: string
      product_title: string
      variant_title: string
      quantity: number
    }> = []
    
    // Process each line item to assign activation keys
    for (const item of order.items || []) {
      if (item.variant_id) {
        // Get an unused activation key for this product variant
        const activationKey = await activationKeyModuleService.retrieveUnusedKey(
          item.variant_id, 
          orderId
        )

        if (activationKey) {
          console.log(`✅ Assigned activation key for variant ${item.variant_id} to order ${orderId}`)
          activationKeys.push({
            key: activationKey.key,
            product_title: item.product_title || 'Unknown Product',
            variant_title: item.variant_title || 'Unknown Variant',
            quantity: item.quantity
          })
        } else {
          console.warn(`⚠️ No unused activation key found for variant ${item.variant_id} in order ${orderId}`)
        }
      }
    }

    // Send email if we have activation keys and customer email
    if (activationKeys.length > 0 && order.email) {
      await sendActivationKeyEmail({
        notificationModuleService,
        customerEmail: order.email,
        customerName: getCustomerName(order),
        orderId,
        activationKeys
      })
      
      console.log(`✅ Sent activation keys email to ${order.email} for order ${orderId}`)
    } else if (activationKeys.length === 0) {
      console.log(`ℹ️ No activation keys to send for order ${orderId}`)
    } else {
      console.warn(`⚠️ Order ${orderId} has activation keys but no customer email`)
    }
    
  } catch (error) {
    console.error(`❌ Error processing order payment captured for ${orderId}:`, error)
  }
}

// Helper function to send activation key email
async function sendActivationKeyEmail({
  notificationModuleService,
  customerEmail,
  customerName,
  orderId,
  activationKeys
}: {
  notificationModuleService: any
  customerEmail: string
  customerName: string
  orderId: string
  activationKeys: Array<{
    key: string
    product_title: string
    variant_title: string
    quantity: number
  }>
}) {
  const keysList = activationKeys
    .map(ak => `${ak.product_title} - ${ak.variant_title}: ${ak.key}`)
    .join('\n')

  const emailContent = `
Дорогой ${customerName},

Спасибо за ваш заказ #${orderId}!

Ваши ключи активации:

${keysList}

Используйте эти ключи для активации ваших продуктов.

С уважением,
Команда Code-Top
  `.trim()

  try {
    await notificationModuleService.createNotifications({
      to: customerEmail,
      channel: "email",
      template: "order-activation-keys",
      data: {
        customer_name: customerName,
        order_id: orderId,
        activation_keys: activationKeys,
        message: emailContent
      }
    })
  } catch (error) {
    console.error(`Failed to send activation keys email:`, error)
    throw error
  }
}

// Helper function to get customer name from order
function getCustomerName(order: any): string {
  if (order.shipping_address?.first_name) {
    return `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`.trim()
  }
  if (order.billing_address?.first_name) {
    return `${order.billing_address.first_name} ${order.billing_address.last_name || ''}`.trim()
  }
  return 'Покупатель'
}

export const config: SubscriberConfig = {
  event: "order.payment_captured",
}

