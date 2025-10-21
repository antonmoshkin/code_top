import React from "react"
import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import SteamGlobalClient from "./steam-global-client"

// Temporarily define metadata here until it can be dynamically generated
export const metadata: Metadata = {
  title: "Пополнение Steam - Global [USD] | CODE-TOP.SHOP",
  description: "Пополнение Steam Global [USD] - Купите подарочные сертификаты Steam для аккаунтов в USD. Мгновенная доставка кода.",
}

type Props = {
  params: { countryCode: string }
}

const SteamGlobalPage = async ({ params: { countryCode } }: Props) => {
  // Fetch region
  const region = await getRegion(countryCode)
  
  if (!region) {
    return (
      <div className="content-container py-12">
        <p>Region not found</p>
      </div>
    )
  }

  // Fetch Steam products from backend
  // Fetching specific product by ID
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      id: "prod_01K3GSZTJ1RB7TAY7PQADWMX1C", // Specific product ID
      limit: 20,
      fields: "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
    },
  })

  const products = response.products

  return (
    <div className="content-container py-12">
      <div className="text-sm breadcrumbs text-gray-600 dark:text-gray-400 mb-6">
        <ul>
          <li>
            <LocalizedClientLink href="/">Главная</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/gaming-services">Игровые сервисы</LocalizedClientLink>
          </li>
          <li>
            <span>Пополнение Steam</span>
          </li>
          <li>
            <span>Steam Global [USD]</span>
          </li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Пополнение Steam - Global [USD]
      </h1>

      {/* Pass products and region to client component with one-click purchase functionality */}
      <SteamGlobalClient products={products} region={region} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Инструкция</h2>
        <p className="mb-2"><span className="font-bold text-red-600">❗ Важно</span> отметить: Это пополнение счета Steam НЕ предназначено для аккаунтов, зарегистрированных в регионах России, Китая, Кореи, Бразилии, Таиланда.</p>
        <p className="mb-4"><span className="font-bold text-red-600">❗ Важно:</span> Валюта вашего аккаунта должна быть в USD!</p>

        <p className="mb-4">ℹ️ Steam подарочные сертификаты - это удобный способ пополнить баланс вашего аккаунта в Steam, который дает возможность приобретать игры и различные виды контента в магазине. Эти карты предназначены для использования на аккаунтах с валютой в долларах США (USD), включая регионы Steam, такие как Турция, Казахстан, США, Аргентина и Европа. После активации подарочной карты деньги сразу же поступают на ваш кошелек Steam.</p>

        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4">
          <li>🗺️ Регион использования: Глобальный</li>
          <li>💰 Валюта магазина: Доллары США [USD]</li>
          <li>➡️ Способ выдачи: Подарочный код</li>
        </ul>

        <p>Ссылка для активации подарочной карты:</p>
        <a
          href="https://store.steampowered.com/account/redeemwalletcode"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          https://store.steampowered.com/account/redeemwalletcode
        </a>
      </div>
    </div>
  )
}

export default SteamGlobalPage
