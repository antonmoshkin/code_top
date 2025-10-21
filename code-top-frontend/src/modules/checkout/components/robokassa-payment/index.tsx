"use client"

import { Button } from "@medusajs/ui"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type RobokassaPaymentProps = {
  cartId: string
  paymentSession: any
  notReady: boolean
  "data-testid"?: string
}

const RobokassaPayment: React.FC<RobokassaPaymentProps> = ({
  cartId,
  paymentSession,
  notReady,
  "data-testid": dataTestId,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // Call the Robokassa payment initiation endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/payment/robokassa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || "",
          },
          body: JSON.stringify({
            cart_id: cartId,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to initiate Robokassa payment"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Redirect to Robokassa payment page
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        throw new Error("Payment URL not received from Robokassa")
      }
    } catch (err: any) {
      console.error("Robokassa payment error:", err)
      setErrorMessage(err.message || "An error occurred while initiating payment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady || submitting}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        Pay with Robokassa
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="robokassa-payment-error-message"
      />
    </>
  )
}

export default RobokassaPayment