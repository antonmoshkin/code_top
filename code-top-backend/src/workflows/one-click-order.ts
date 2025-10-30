import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type WorkflowInput = {
  email?: string
  region_id?: string
}

type WorkflowOutput = {
  order_id: string
}

// Step: Pick random in-stock product variant
const pickRandomInStockVariant = createStep(
  "one-click.pick-random-variant",
  async ({ container }: { container: any }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch product variants with inventory > 0 if possible
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "title", "product_id"],
      // Note: Using simple fetch; inventory levels are managed separately. We'll just pick any variant available
      // If you maintain stock via inventory module, you can join inventory levels here as needed.
      // filters: {}
    })

    if (!variants?.length) {
      throw new Error("No product variants found to create one-click order")
    }

    const random = variants[Math.floor(Math.random() * variants.length)]
    return new StepResponse({ variant_id: random.id })
  }
)

// Step: Create a cart and add the selected variant
const createCartAndAddItem = createStep(
  "one-click.create-cart-add-item",
  async (
    input: {
      variant_id: string
      email?: string
      region_id?: string
    },
    { container }: { container: any }
  ) => {
    const cartModule = container.resolve(Modules.CART)
    const storeModule = container.resolve(Modules.STORE)

    // Get default region if not provided
    let regionId = input.region_id
    if (!regionId) {
      const [store] = await storeModule.listStores()
      // @ts-ignore
      regionId = store?.default_region_id || store?.regions?.[0]?.id
    }

    // Create cart
    // @ts-ignore - v2 cart service shape
    const cart = await cartModule.createCart({
      email: input.email || "oneclick@example.com",
      region_id: regionId,
      currency_code: "rub",
    })

    // Add line item
    // @ts-ignore - v2 cart service shape
    await cartModule.addLineItem(cart.id, {
      variant_id: input.variant_id,
      quantity: 1,
    })

    return new StepResponse({ cart_id: cart.id })
  }
)

// Step: Complete cart to create order
const completeCartToOrder = createStep(
  "one-click.complete-cart",
  async (
    input: { cart_id: string },
    { container }: { container: any }
  ) => {
    const orderModule = container.resolve(Modules.ORDER)
    const cartModule = container.resolve(Modules.CART)

    // Calculate totals if necessary, then complete
    // @ts-ignore
    const completed = await cartModule.completeCart(input.cart_id)

    // completed may already return order; otherwise, fetch latest order by cart relation
    let orderId = completed?.order_id
    if (!orderId) {
      // @ts-ignore
      const orders = await orderModule.listOrders({ cart_id: input.cart_id })
      orderId = orders?.[0]?.id
    }

    if (!orderId) {
      throw new Error("Failed to create order from cart")
    }

    return new StepResponse({ order_id: orderId })
  }
)

const oneClickOrderWorkflow = createWorkflow(
  "one-click-order",
  (input: WorkflowInput) => {
    const { variant_id } = pickRandomInStockVariant()

    const { cart_id } = createCartAndAddItem({
      variant_id,
      email: input.email,
      region_id: input.region_id,
    })

    const { order_id } = completeCartToOrder({ cart_id })

    return new WorkflowResponse<WorkflowOutput>({ order_id })
  }
)

export default oneClickOrderWorkflow



