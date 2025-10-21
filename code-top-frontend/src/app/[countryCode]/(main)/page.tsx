import { Metadata } from "next"

// import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
// import { listCollections } from "@lib/data/collections"
// import { getRegion } from "@lib/data/regions"
import CategorySection from "@modules/home/components/category-section"

export const metadata: Metadata = {
  title: "CODE-TOP.SHOP",
  description: "Верни доступ к любимым сервисам - Подписки Spotify, Netflix и Xbox. Карты оплаты самых популярных сервисов развлечений: PlayStation, Apple, Steam и другие",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  // const region = await getRegion(countryCode)

  // const { collections } = await listCollections({
  //   fields: "id, handle, title",
  // })

  // if (!collections || !region) {
  //   return null
  // }

  const gamingServices = [
    { name: "Playstation", href: "/gaming-services/playstation" },
    { name: "XBOX", href: "/gaming-services/xbox" },
    { name: "Blizzard", href: "/gaming-services/blizzard" },
    { name: "Nintendo", href: "/gaming-services/nintendo" },
    { name: "EA Play", href: "/gaming-services/eaplay" },
    { name: "Steam", href: "/gaming-services/steam" },
    { name: "Razer Gold", href: "/gaming-services/razer-gold" },
  ]

  const paymentServices = [
    { name: "Apple", href: "/payment-services/apple" },
    { name: "Netflix", href: "/payment-services/netflix" },
    { name: "Нейросети", href: "/payment-services/neural-networks" },
    { name: "Spotify Premium", href: "/payment-services/spotify-premium" },
    { name: "Bigo Live", href: "/payment-services/bigo-live" },
    { name: "Exitlag", href: "/payment-services/exitlag" },
    { name: "Gear UP", href: "/payment-services/gear-up" },
  ]

  const donatInGames = [
    { name: "Roblox", href: "/donat-in-games/roblox" },
    { name: "PUBG Mobile", href: "/donat-in-games/pubg-mobile" },
    { name: "Fortnite", href: "/donat-in-games/fortnite" },
    { name: "Minecraft", href: "/donat-in-games/minecraft" },
    { name: "Brawl Stars", href: "/donat-in-games/brawl-stars" },
    { name: "Clash of Clans", href: "/donat-in-games/clash-of-clans" },
    { name: "Clash Royale", href: "/donat-in-games/clash-royale" },
    { name: "World of Warcraft", href: "/donat-in-games/world-of-warcraft" },
    { name: "Mobile Legends Bang Bang", href: "/donat-in-games/mobile-legends" },
    { name: "League of Legends", href: "/donat-in-games/league-of-legends" },
    { name: "Другие ->", href: "/donat-in-games/other" },
  ]

  return (
    <>
      <Hero />
      <div className="py-12 px-4 content-container">
        <CategorySection title="ИГРОВЫЕ СЕРВИСЫ" items={gamingServices} />
        <CategorySection title="ОПЛАТА СЕРВИСОВ" items={paymentServices} />
        <CategorySection title="ДОНАТ В ИГРЫ" items={donatInGames} />
      </div>
    </>
  )
}
