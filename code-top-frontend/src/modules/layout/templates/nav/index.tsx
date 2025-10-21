import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SearchBar from "@modules/layout/components/search-bar"
// import CartButton from "@modules/layout/components/cart-button"
// import SideMenu from "@modules/layout/components/side-menu"
// import ThemeToggle from "@modules/common/components/theme-toggle"

export default async function Nav() {
  // const regions = await listRegions().then((regions: StoreRegion[]) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base dark:bg-black dark:border-gray-700">
        <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase font-bold"
              data-testid="nav-store-link"
            >
              CODE-TOP.SHOP
            </LocalizedClientLink>
          </div>

          <div className="flex items-center h-full gap-x-6">
            <LocalizedClientLink
              className="hover:text-ui-fg-base"
              href="/gaming-services"
            >
              Игровые сервисы
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hover:text-ui-fg-base"
              href="/payment-services"
            >
              Оплата сервисов
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hover:text-ui-fg-base"
              href="/donat-in-games"
            >
              Донат в игры
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <SearchBar />
          </div>
        </nav>
      </header>
    </div>
  )
}
