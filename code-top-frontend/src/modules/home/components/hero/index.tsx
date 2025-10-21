// import { Github } from "@medusajs/icons"
// import { Button, Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle flex items-center justify-center">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center p-4 small:p-32 gap-6">
        <h1 className="text-5xl leading-tight text-gray-900 dark:text-gray-100 font-bold">
          Верни доступ к любимым сервисам
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl">
          Подписки Spotify, Netflix и Xbox. Карты оплаты самых популярных
          сервисов развлечений: PlayStation, Apple, Steam и другие
        </p>
        <button className="contrast-btn mt-4">В КАТАЛОГ</button>
      </div>
    </div>
  )
}

export default Hero
