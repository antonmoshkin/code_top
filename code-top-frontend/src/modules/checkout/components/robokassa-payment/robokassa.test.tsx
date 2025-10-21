import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import RobokassaPayment from "./index"

// Mock fetch API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("RobokassaPayment", () => {
  const defaultProps = {
    cartId: "cart_123",
    paymentSession: { id: "ps_123" },
    notReady: false,
    "data-testid": "robokassa-payment-button",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the Robokassa payment button", () => {
    render(<RobokassaPayment {...defaultProps} />)
    
    expect(screen.getByTestId("robokassa-payment-button")).toBeInTheDocument()
    expect(screen.getByText("Pay with Robokassa")).toBeInTheDocument()
  })

  it("disables the button when notReady is true", () => {
    render(<RobokassaPayment {...defaultProps} notReady={true} />)
    
    const button = screen.getByTestId("robokassa-payment-button")
    expect(button).toBeDisabled()
  })

  it("shows error message when payment initiation fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Payment initiation failed" }),
    })

    render(<RobokassaPayment {...defaultProps} />)
    
    const button = screen.getByTestId("robokassa-payment-button")
    await fireEvent.click(button)
    
    // Wait for error message to appear
    const errorMessage = await screen.findByTestId("robokassa-payment-error-message")
    expect(errorMessage).toBeInTheDocument()
  })
})