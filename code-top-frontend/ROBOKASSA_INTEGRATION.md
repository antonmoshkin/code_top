# Robokassa Payment Integration

This document explains how to integrate Robokassa payment provider into the Medusa.js storefront.

## Overview

Robokassa is a popular payment provider in Russia and other CIS countries. This integration allows customers to pay using various payment methods supported by Robokassa.

## Endpoints

The integration uses the following endpoints:

- `POST /store/payment/robokassa` - To initiate payments
- `GET /store/payment/robokassa` - To check service status
- `POST /robokassa` - For webhook callbacks

## Implementation Details

### 1. Constants Configuration

The Robokassa provider is added to the [paymentInfoMap](file://src/lib/constants.tsx#L9-L42) in [src/lib/constants.tsx](file://src/lib/constants.tsx):

```typescript
pp_robokassa: {
  title: "Robokassa",
  icon: <CreditCard />,
},
```

### 2. Provider Detection

A new function [isRobokassa](file://src/lib/constants.tsx#L49-L51) is added to detect Robokassa payment provider:

```typescript
export const isRobokassa = (providerId?: string) => {
  return providerId === "pp_robokassa"
}
```

### 3. Payment Component

A new component [RobokassaPayment](file://src/modules/checkout/components/robokassa-payment/index.tsx) handles the payment flow:

1. When the user clicks "Pay with Robokassa", the component calls the Medusa backend endpoint
2. The backend returns a payment URL
3. The user is redirected to the Robokassa payment page

### 4. Payment Button Integration

The [PaymentButton](file://src/modules/checkout/components/payment-button/index.tsx) component is updated to handle Robokassa payments:

```typescript
case isRobokassa(paymentSession?.provider_id):
  return (
    <RobokassaPayment
      cartId={cart.id}
      paymentSession={paymentSession}
      notReady={notReady}
      data-testid={dataTestId}
    />
  )
```

## Usage

1. Ensure the Robokassa payment provider is configured in your Medusa backend
2. The provider will appear in the list of available payment methods
3. When selected, customers can pay using Robokassa

## Error Handling

The integration includes proper error handling:
- Network errors are caught and displayed to the user
- Backend errors are parsed and shown as user-friendly messages
- Loading states are managed to provide feedback during payment initiation

## Testing

Unit tests are included in [robokassa.test.tsx](file://src/modules/checkout/components/robokassa-payment/robokassa.test.tsx) to verify:
- Component rendering
- Button states
- Error handling