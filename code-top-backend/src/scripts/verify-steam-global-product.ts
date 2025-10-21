import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function verifySteamGlobalProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Verifying Steam Global [USD] product...");

  // Get the Steam Global product with all its details
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id", 
      "title", 
      "description", 
      "handle", 
      "status",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "variants.options.value",
      "options.title",
      "categories.id",
      "categories.name"
    ],
    filters: {
      handle: "steam-global-usd"
    }
  });

  if (!products.length) {
    logger.error("Steam Global [USD] product not found!");
    return;
  }

  const product = products[0];
  
  logger.info("✅ Product found!");
  logger.info(`Product ID: ${product.id}`);
  logger.info(`Title: ${product.title}`);
  logger.info(`Handle: ${product.handle}`);
  logger.info(`Status: ${product.status}`);
  logger.info(`Categories: ${product.categories?.map((cat: any) => cat.name).join(", ") || "None"}`);
  logger.info(`Options: ${product.options?.map((opt: any) => opt.title).join(", ") || "None"}`);
  logger.info(`Number of variants: ${product.variants?.length || 0}`);

  if (product.variants && product.variants.length > 0) {
    logger.info("\\nVariants:");
    product.variants.forEach((variant: any, index: number) => {
      logger.info(`  ${index + 1}. ${variant.title} (SKU: ${variant.sku})`);
      if (variant.prices && variant.prices.length > 0) {
        variant.prices.forEach((price: any) => {
          const amount = (price.amount / 100).toFixed(2); // Convert from minor units
          logger.info(`     Price: ${amount} ${price.currency_code.toUpperCase()}`);
        });
      }
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option: any) => {
          logger.info(`     Option: ${option.value}`);
        });
      }
    });
  }

  logger.info("\\n✅ Verification complete!");
  
  return {
    product,
    verified: true
  };
}