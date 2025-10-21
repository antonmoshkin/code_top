import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  // const { collections } = await listCollections({
  //   fields: "*products",
  // })
  // const productCategories = await listCategories()

  return (
    <footer className="border-t border-ui-border-base w-full bg-white dark:bg-black text-gray-900 dark:text-gray-100 py-12">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between pb-8">
          <div>
            <LocalizedClientLink
              href="/"
              className="hover:text-gray-600 dark:hover:text-gray-400 uppercase font-bold text-xl"
            >
              CODE-TOP.SHOP
            </LocalizedClientLink>
          </div>
          <div className="text-small-regular flex flex-col gap-y-2">
            <LocalizedClientLink className="hover:text-gray-600 dark:hover:text-gray-400" href="/privacy-policy">
              Политика конфиденциальности
            </LocalizedClientLink>
            <LocalizedClientLink className="hover:text-gray-600 dark:hover:text-gray-400" href="/user-agreement">
              Пользовательское соглашение
            </LocalizedClientLink>
            <LocalizedClientLink className="hover:text-gray-600 dark:hover:text-gray-400" href="/public-offer">
              Публичная Оферта
            </LocalizedClientLink>
          </div>
          <div className="flex flex-col gap-y-2 text-small-regular">
            <span className="font-bold">Наименование:</span>
            <span>Индивидуальный предприниматель Картамышев Артур Алексеевич</span>
            <span className="font-bold">ИНН:</span>
            <span>502423400222</span>
            <span className="font-bold">ОГРНИП:</span>
            <span>324080000015407</span>
            <span className="font-bold">Юридический адрес:</span>
            <span>359187, РОССИЯ, Респ. КАЛМЫКИЯ, р-н ЦЕЛИННЫЙ, п ВЕРХНИЙ ЯШКУЛЬ, ул ЦЕНТРАЛЬНАЯ, ДОМ 41, кв. 1</span>
            <a
              href="https://t.me/yourtelegramlink"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-400 mt-2"
            >
              Telegram
            </a>
          </div>
        </div>
        <div className="flex w-full justify-between border-t border-ui-border-base pt-8 text-gray-700 dark:text-gray-300">
          <span>© {new Date().getFullYear()} CODE-TOP.SHOP. Все права защищены.</span>
        </div>
      </div>
    </footer>
  )
}
