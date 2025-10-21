import { model } from "@medusajs/framework/utils"

export const ActivationKey = model.define("activation_key", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  product_variant_id: model.text(),
  is_used: model.boolean().default(false),
  order_id: model.text().nullable(),
  used_at: model.dateTime().nullable(),
})

export default ActivationKey

