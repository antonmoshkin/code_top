'use client'

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { addToCart, getOrSetCart, retrieveCart, setShippingMethod as setCartShippingMethod } from "@lib/data/cart"
import { listCartPaymentMethods } from "@lib/data/payment"
import { listCartShippingMethods } from "@lib/data/fulfillment"

// Add these imports for the modal functionality
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import ItemsTemplate from "@modules/cart/templates/items"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { Button } from "@medusajs/ui"

type Product = HttpTypes.StoreProduct
type Variant = NonNullable<Product["variants"]>[number]

type Props = {
  products: Product[]
  region: HttpTypes.StoreRegion
}

const SteamGlobalClient = ({ products, region }: Props) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    (products[0]?.variants && products[0]?.variants[0]) || null
  )
  const [isOneClickOpen, setIsOneClickOpen] = useState(false)
  const [buyerEmail, setBuyerEmail] = useState("")
  const router = useRouter()

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No Steam products found in backend. Please add Steam products to your Medusa backend.</p>
        <p className="text-sm text-gray-500 mt-2">To filter specific products, you can use collection_id, category_id, or tags in the queryParams</p>
      </div>
    )
  }

  // Keep selected variant in sync with selected product (pick cheapest)
  useEffect(() => {
    const variants = selectedProduct?.variants || []
    if (!variants.length) {
      setSelectedVariant(null)
      return
    }
    const cheapest = [...variants].sort((a, b) => {
      const aAmt = a?.calculated_price?.calculated_amount
      const bAmt = b?.calculated_price?.calculated_amount
      if (aAmt == null && bAmt == null) return 0
      if (aAmt == null) return 1
      if (bAmt == null) return -1
      return aAmt - bAmt
    })[0]
    setSelectedVariant(cheapest || null)
  }, [selectedProduct])

  // Function to add product to cart
  const handleAddToCart = async () => {
    if (!selectedProduct) return

    setIsLoading(true)
    try {
      const variantToAdd = selectedVariant || selectedProduct.variants?.[0]
      if (!variantToAdd) {
        throw new Error("Нет доступных вариаций для добавления")
      }

      // Add product to cart
      await addToCart({
        variantId: variantToAdd.id,
        quantity: 1,
        countryCode: region.countries?.[0]?.iso_2 || "us",
      })

      // Retrieve updated cart
      const updatedCart = await retrieveCart()
      setCart(updatedCart)
      
      // Open cart modal
      setIsCartModalOpen(true)
    } catch (error) {
      console.error("Error adding to cart:", error)
      alert(`Ошибка при добавлении в корзину: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Lightweight redirect flow: call backend to get Robokassa URL and redirect
  const redirectToRobokassa = async (email: string) => {
    if (!selectedProduct) return
    const variant = selectedVariant || selectedProduct.variants?.[0]
    if (!variant?.calculated_price) {
      throw new Error("Недоступна цена вариации для оплаты")
    }

    const amount = variant.calculated_price.calculated_amount
    const currencyCode = variant.calculated_price.currency_code || region.currency_code
    const description = `${selectedProduct.title}${variant.title ? ` - ${variant.title}` : ""}`

    const resp = await fetch(`http://localhost:9000/store/robokassa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
      },
      body: JSON.stringify({ amount, currency_code: currencyCode, description, email }),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      throw new Error(`Ошибка инициализации оплаты: ${resp.status} - ${txt}`)
    }

    const data = await resp.json()
    const redirectUrl = data?.redirectUrl
    if (!redirectUrl) {
      throw new Error("Не удалось получить ссылку на Robokassa")
    }

    window.location.href = redirectUrl
  }

  const handleBuyNow = async (email?: string) => {
    if (!selectedProduct) return

    setIsLoading(true)
    try {
      // Step 1: Get or create cart using SDK
      console.log("Getting or creating cart...")
      let cart = await getOrSetCart(region.countries?.[0]?.iso_2 || "us")
      
      if (!cart) {
        throw new Error("Failed to create or retrieve cart")
      }

      console.log(`Cart created/retrieved with ID: ${cart.id}`)

      // Step 2: Add product to cart using SDK
      const variantToAdd = selectedVariant || selectedProduct.variants?.[0]
      if (!variantToAdd) {
        throw new Error("Нет доступных вариаций для добавления")
      }

      console.log(`Adding variant ${variantToAdd.id} to cart ${cart.id}...`)
      await addToCart({
        variantId: variantToAdd.id,
        quantity: 1,
        countryCode: region.countries?.[0]?.iso_2 || "us",
      })

      // Refresh cart after adding item
      const updatedCart1 = await retrieveCart()
      if (!updatedCart1) {
        throw new Error("Failed to retrieve updated cart")
      }
      cart = updatedCart1

      // Step 3: Set shipping and billing addresses
      console.log(`Setting addresses for cart ${cart.id}...`)
      const addressData = {
        shipping_address: {
          first_name: "Steam",
          last_name: "Customer",
          address_1: "123 Gaming Street",
          city: "Digital City",
          country_code: region.countries?.[0]?.iso_2 || "us",
          postal_code: "12345",
          phone: "+1234567890"
        },
        billing_address: {
          first_name: "Steam",
          last_name: "Customer",
          address_1: "123 Gaming Street",
          city: "Digital City",
          country_code: region.countries?.[0]?.iso_2 || "us",
          postal_code: "12345",
          phone: "+1234567890"
        },
        email: email || "customer@example.com"
      }
      
      await fetch(`http://localhost:9000/store/carts/${cart.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
        },
        body: JSON.stringify(addressData),
      })

      // Refresh cart after setting addresses
      const updatedCart2 = await retrieveCart()
      if (!updatedCart2) {
        throw new Error("Failed to retrieve cart after setting addresses")
      }
      cart = updatedCart2

      // Step 4: Get and set shipping method
      console.log(`Getting shipping methods for cart ${cart.id}...`)
      const shippingMethods = await listCartShippingMethods(cart.id)
      
      if (shippingMethods && shippingMethods.length > 0) {
        const shippingMethodId = shippingMethods[0].id
        console.log(`Setting shipping method ${shippingMethodId}...`)
        await setCartShippingMethod({
          cartId: cart.id,
          shippingMethodId: shippingMethodId
        })
        
        // Refresh cart after setting shipping method
        const updatedCart3 = await retrieveCart()
        if (!updatedCart3) {
          throw new Error("Failed to retrieve cart after setting shipping method")
        }
        cart = updatedCart3
      }

      // Step 5: Get payment methods
      console.log(`Getting payment methods for region ${region.id}...`)
      const paymentMethods = await listCartPaymentMethods(region.id)
      
      if (!paymentMethods || paymentMethods.length === 0) {
        throw new Error("No payment methods available")
      }

      // Find a suitable payment provider (prefer test provider)
      const testProvider = paymentMethods.find((p: any) => 
        p.id === 'pp_test_pay' || p.id.includes('test')
      )
      const robokassaProvider = paymentMethods.find((p: any) => 
        p.id === 'pp_robokassa'
      )
      const paymentProviderId = robokassaProvider?.id || testProvider?.id || paymentMethods[0].id

      // Step 6: Initialize payment collection
      console.log(`Initializing payment collection for cart ${cart.id}...`)
      const paymentCollectionResponse = await fetch(`http://localhost:9000/store/carts/${cart.id}/payment-collection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
        },
      })
      
      if (!paymentCollectionResponse.ok) {
        const errorText = await paymentCollectionResponse.text()
        console.error('Payment collection initialization failed:', errorText)
        throw new Error(`Failed to initialize payment collection: ${paymentCollectionResponse.status} - ${errorText}`)
      }

      // Step 7: Create and set payment session
      console.log(`Creating payment session with provider ${paymentProviderId}...`)
      await fetch(`http://localhost:9000/store/carts/${cart.id}/payment-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
        },
        body: JSON.stringify({
          provider_id: paymentProviderId
        }),
      })
      
      // Set the payment session as selected
      console.log(`Setting payment session as active...`)
      await fetch(`http://localhost:9000/store/carts/${cart.id}/payment-sessions/${paymentProviderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
        },
      })

      // Step 8: Validate cart before completion / attempt redirect to provider
      console.log(`Validating cart ${cart.id} before completion...`)
      const updatedCart = await retrieveCart()
      
      if (!updatedCart) {
        throw new Error("Failed to retrieve updated cart")
      }

      // Try to redirect to Robokassa if redirect URL is present in session data
      try {
        const sessions: any[] | undefined = (updatedCart as any)?.payment_collection?.payment_sessions
        const activeSession = sessions?.find((s: any) => s.provider_id === paymentProviderId) || sessions?.[0]
        const redirectUrl = activeSession?.data?.redirectUrl || activeSession?.data?.redirect_url
        if (redirectUrl) {
          window.location.href = redirectUrl
          return
        }
      } catch (e) {
        // ignore and proceed to complete order fallback
      }
      
      // Check if all required fields are present
      if (!updatedCart.shipping_address) {
        throw new Error("Shipping address is missing")
      }
      if (!updatedCart.billing_address) {
        throw new Error("Billing address is missing")
      }
      if (!updatedCart.email) {
        throw new Error("Email is missing")
      }
      if (!updatedCart.shipping_methods || updatedCart.shipping_methods.length === 0) {
        throw new Error("No shipping method selected")
      }
      if (!updatedCart.payment_collection || !updatedCart.payment_collection.payment_sessions || updatedCart.payment_collection.payment_sessions.length === 0) {
        throw new Error("Payment session not initialized")
      }
      
      console.log(`Cart validation successful. Ready to complete order.`)
      
      // Step 9: Complete the order
      console.log(`Completing order for cart ${cart.id}...`)
      const orderResponse = await fetch(`http://localhost:9000/store/carts/${cart.id}/complete`, {
        method: "POST",
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY!,
        },
      })
      
      if (!orderResponse.ok) {
        const errorText = await orderResponse.text()
        console.error('Order completion failed:', errorText)
        console.error('Cart state at failure:', updatedCart)
        
        // Try to parse the error for more specific information
        let errorMessage = `Failed to complete order: ${orderResponse.status} - ${errorText}`
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch (e) {
          // Error text is not JSON, keep original message
        }
        
        throw new Error(errorMessage)
      }
      
      const orderData = await orderResponse.json()

      if (orderData.type === 'order' && orderData.order) {
        alert("Заказ успешно оформлен!")
        router.push(`/order/${orderData.order.id}/confirmed`)
      } else {
        console.error('Unexpected order response:', orderData)
        throw new Error("Не удалось оформить заказ.")
      }
    } catch (error) {
      console.error("Ошибка при оформлении заказа в один клик:", error)
      alert(`Ошибка при оформлении заказа: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getProductPrice = (product: Product) => {
    const variant = product.variants?.[0]
    if (!variant?.calculated_price) return "N/A"
    
    const price = variant.calculated_price.calculated_amount
    if (price === null || price === undefined) return "N/A"
    
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: variant.calculated_price.currency_code || 'RUB'
    }).format(price)
  }

  const getVariantPrice = (variant: Variant | null | undefined) => {
    if (!variant?.calculated_price) return "N/A"
    const price = variant.calculated_price.calculated_amount
    if (price === null || price === undefined) return "N/A"
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: variant.calculated_price.currency_code || 'RUB'
    }).format(price)
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-2 gap-8">
      <div>
        
        {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Продукт</h3>
            <div className="grid grid-cols-2 gap-3">
              {[...(selectedProduct.variants || [])]
                .sort((a, b) => {
                  const aAmt = a?.calculated_price?.calculated_amount
                  const bAmt = b?.calculated_price?.calculated_amount
                  if (aAmt == null && bAmt == null) return 0
                  if (aAmt == null) return 1
                  if (bAmt == null) return -1
                  return aAmt - bAmt
                })
                .map((variant) => (
                <button
                  key={variant.id}
                  className={`p-3 border rounded-md text-left transition-colors duration-200 ${
                    selectedVariant?.id === variant.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{variant.title || 'Вариация'}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{getVariantPrice(variant)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          К оплате: {selectedVariant ? getVariantPrice(selectedVariant) : selectedProduct ? getProductPrice(selectedProduct) : "N/A"}
        </h2>
        
        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          disabled={isLoading || !selectedProduct}
          className="w-full py-3 text-lg mb-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200"
        >
          {isLoading ? "Добавление..." : "ДОБАВИТЬ В КОРЗИНУ"}
        </button>
        
        <button 
          onClick={() => setIsOneClickOpen(true)}
          disabled={isLoading || !selectedProduct}
          className="contrast-btn w-full py-3 text-lg mt-2"
        >
          {isLoading ? "Оформление..." : "ОФОРМИТЬ ЗАКАЗ В ОДИН КЛИК"}
        </button>
        
        {selectedProduct && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Выбранный продукт:</strong> {selectedProduct.title}</p>
            <p><strong>Регион:</strong> {region.name}</p>
            <p><strong>Валюта:</strong> {region.currency_code}</p>
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">
              <p><strong>Полный цикл оформления:</strong></p>
              <ul className="mt-1 space-y-1">
                <li>• Получение/создание корзины</li>
                <li>• Добавление товара</li>
                <li>• Указание адреса доставки</li>
                <li>• Выбор способа доставки</li>
                <li>• Получение методов оплаты</li>
                <li>• Инициализация коллекции платежей</li>
                <li>• Настройка платежной сессии</li>
                <li>• Завершение заказа</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <Transition appear show={isCartModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCartModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-gray-800 text-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Корзина
                  </Dialog.Title>
                  <div className="mt-2">
                    {cart?.items?.length ? (
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-x-8">
                        <div className="flex flex-col">
                          <div className="pb-3 flex items-center">
                            <h2 className="text-[2rem] leading-[2.75rem] text-white">Корзина</h2>
                          </div>
                          <ItemsTemplate cart={cart} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex flex-col gap-y-4">
                            <h2 className="text-[2rem] leading-[2.75rem] text-white">Итого</h2>
                            <Divider className="border-gray-600" />
                            <CartTotals totals={cart} />
                            <LocalizedClientLink
                              href={"/checkout"}
                              data-testid="checkout-button"
                            >
                              <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white">
                                Оформить заказ
                              </Button>
                            </LocalizedClientLink>
                          </div>
                          <LocalizedClientLink href="/cart" passHref>
                            <button
                              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              onClick={() => setIsCartModalOpen(false)}
                            >
                              Перейти в корзину
                            </button>
                          </LocalizedClientLink>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-300">Ваша корзина пуста</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsCartModalOpen(false)}
                    >
                      Продолжить покупки
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* One-Click Purchase Modal */}
      <Transition appear show={isOneClickOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isLoading && setIsOneClickOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gray-800 text-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    Покупка в один клик
                  </Dialog.Title>
                  <div className="mt-4 text-sm text-gray-300">
                    {selectedProduct && (
                      <div className="mb-4">
                        <div className="font-medium text-white">{selectedProduct.title}</div>
                        <div className="text-xs text-gray-400">Вариация: {selectedVariant?.title || '—'}</div>
                        <div className="mt-1">К оплате: {selectedVariant ? getVariantPrice(selectedVariant) : selectedProduct ? getProductPrice(selectedProduct) : 'N/A'}</div>
                      </div>
                    )}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setIsLoading(true)
                        try {
                          await redirectToRobokassa(buyerEmail)
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                      className="flex flex-col gap-3"
                    >
                      <label className="text-sm text-gray-300">
                        E-mail
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className="mt-1 w-full rounded-md bg-gray-700 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="you@example.com"
                        />
                      </label>
                      <div className="mt-2 flex gap-3">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                          {isLoading ? 'Обработка…' : 'Перейти к оплате'}
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => setIsOneClickOpen(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default SteamGlobalClient