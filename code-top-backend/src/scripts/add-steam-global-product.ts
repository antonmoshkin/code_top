import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function addSteamGlobalProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Starting Steam Global product creation...");

  // Get default sales channel
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    throw new Error("Default Sales Channel not found. Please run the seed script first.");
  }

  // Get default shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default"
  });

  if (!shippingProfiles.length) {
    throw new Error("Default shipping profile not found. Please run the seed script first.");
  }

  const shippingProfile = shippingProfiles[0];

  // Create or get Gaming category
  logger.info("Checking for Gaming category...");
  
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
    filters: {
      handle: "gaming"
    }
  });
  
  let gamingCategory;
  
  if (existingCategories.length > 0) {
    gamingCategory = existingCategories[0];
    logger.info(`Using existing Gaming category with ID: ${gamingCategory.id}`);
  } else {
    logger.info("Creating new Gaming category...");
    const { result: categoryResult } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: [
          {
            name: "Gaming",
            description: "Digital gaming products and gift cards",
            is_active: true,
          },
        ],
      },
    });
    gamingCategory = categoryResult[0];
    logger.info(`Created new Gaming category with ID: ${gamingCategory.id}`);
  }

  // Check if Steam Global product already exists
  logger.info("Checking for existing Steam Global [USD] product...");
  
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
    filters: {
      handle: "steam-global-usd"
    }
  });
  
  if (existingProducts.length > 0) {
    const existingProduct = existingProducts[0];
    logger.info(`Steam Global [USD] product already exists with ID: ${existingProduct.id}`);
    return {
      product: existingProduct,
      category: gamingCategory,
      message: "Product already exists"
    };
  }

  // Create Steam Global product
  logger.info("Creating Steam Global [USD] product...");
  const { result: productResult } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Steam Global [USD]",
          description: "Пополнение Steam Global [USD] - Купите подарочные сертификаты Steam для аккаунтов в USD. Мгновенная доставка кода. Это пополнение счета Steam НЕ предназначено для аккаунтов, зарегистрированных в регионах России, Китая, Кореи, Бразилии, Таиланда. Валюта вашего аккаунта должна быть в USD!",
          handle: "steam-global-usd",
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: [gamingCategory.id],
          options: [
            {
              title: "Amount",
              values: ["5 USD", "10 USD", "15 USD", "20 USD", "25 USD", "50 USD", "75 USD", "100 USD"],
            },
          ],
          variants: [
            {
              title: "5 USD",
              sku: "steam_global_5",
              options: {
                Amount: "5 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 98000, // 980.00 RUB
                },
              ],
            },
            {
              title: "10 USD",
              sku: "steam_global_10",
              options: {
                Amount: "10 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 150000, // 1500.00 RUB
                },
              ],
            },
            {
              title: "15 USD",
              sku: "steam_global_15",
              options: {
                Amount: "15 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 199000, // 1990.00 RUB
                },
              ],
            },
            {
              title: "20 USD",
              sku: "steam_global_20",
              options: {
                Amount: "20 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 254000, // 2540.00 RUB
                },
              ],
            },
            {
              title: "25 USD",
              sku: "steam_global_25",
              options: {
                Amount: "25 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 294500, // 2945.00 RUB
                },
              ],
            },
            {
              title: "50 USD",
              sku: "steam_global_50",
              options: {
                Amount: "50 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 599000, // 5990.00 RUB
                },
              ],
            },
            {
              title: "75 USD",
              sku: "steam_global_75",
              options: {
                Amount: "75 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 884900, // 8849.00 RUB
                },
              ],
            },
            {
              title: "100 USD",
              sku: "steam_global_100",
              options: {
                Amount: "100 USD",
              },
              prices: [
                {
                  currency_code: "rub",
                  amount: 1199000, // 11990.00 RUB
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });

  const steamProduct = productResult[0];
  logger.info(`Created Steam Global product with ID: ${steamProduct.id}`);

  // Set inventory levels for the product variants
  logger.info("Setting inventory levels for Steam Global product variants...");
  
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
    filters: {
      sku: {
        $in: [
          "steam_global_5",
          "steam_global_10", 
          "steam_global_15",
          "steam_global_20",
          "steam_global_25",
          "steam_global_50",
          "steam_global_75",
          "steam_global_100"
        ]
      }
    }
  });

  // Get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  });

  if (stockLocations.length > 0) {
    const stockLocation = stockLocations[0];
    
    const inventoryLevels = inventoryItems.map((inventoryItem: any) => ({
      location_id: stockLocation.id,
      stocked_quantity: 1000000, // Large quantity for digital products
      inventory_item_id: inventoryItem.id,
    }));

    if (inventoryLevels.length > 0) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: inventoryLevels,
        },
      });
      logger.info(`Set inventory levels for ${inventoryLevels.length} variants`);
    }
  } else {
    logger.warn("No stock locations found - skipping inventory level setup");
  }

  logger.info("Successfully created Steam Global [USD] product with all variants!");
  logger.info(`Product ID: ${steamProduct.id}`);
  logger.info(`Category: Gaming (ID: ${gamingCategory.id})`);
  logger.info(`Variants created: ${steamProduct.variants?.length || 0}`);
  
  return {
    product: steamProduct,
    category: gamingCategory,
  };
}