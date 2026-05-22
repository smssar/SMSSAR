# Dodo Payments Integration

This project now integrates **Dodo Payments** for plan purchases.

## Setup Required

Add the following environment variables to your `.env.local`:

```env
# Dodo Payments API Configuration
DODO_API_KEY=your_dodo_api_key_here
DODO_MERCHANT_ID=your_dodo_merchant_id_here
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret_here

# Base URL for callbacks (required for webhooks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Replace these with your actual Dodo account credentials from the Dodo Payments dashboard.

## Files Created

### 1. **Checkout Route**

- **Path**: `/src/app/api/payments/dodo-checkout/route.ts`
- **Purpose**: Creates a Dodo checkout session and returns the checkout URL
- **Method**: `POST`
- **Body**: `{ planId: string }`
- **Response**: `{ checkoutUrl: string; sessionId: string }`

### 2. **Webhook Handler**

- **Path**: `/src/app/api/webhooks/dodo/route.ts`
- **Purpose**: Processes Dodo payment completion webhooks
- **Verifies**: HMAC signature using `DODO_WEBHOOK_SECRET`
- **Action**: Updates user's `planId` in database on successful payment

### 3. **Checkout Button Component**

- **Path**: `/src/components/payment/dodo-checkout-button.tsx`
- **Type**: Client component
- **Purpose**: Displays checkout summary and handles redirect to Dodo

### 4. **Payment Success Page**

- **Path**: `/src/app/[locale]/(public)/payments/success/page.tsx`
- **Purpose**: Confirmation page after successful payment
- **Shows**: Session ID and next steps

### 5. **Updated Payments Page**

- **Path**: `/src/app/[locale]/(public)/payments/page.tsx`
- **Changes**: Routes to Dodo checkout instead of form submission

## Flow

1. **User clicks "Get this plan"** on pricing page
2. **Routed to** `/payments?plan={planId}`
3. **Clicks "Pay now"** on checkout button
4. **Redirected to** Dodo's hosted checkout
5. **After payment**, Dodo sends webhook to `/api/webhooks/dodo`
6. **User's plan** updated in database
7. **Redirected to** `/payments/success`

## Webhook Configuration

In your Dodo dashboard, set the webhook URL to:

```
https://yourdomain.com/api/webhooks/dodo
```

## Security Notes

- ✅ Webhook signatures validated using HMAC-SHA256
- ✅ User authentication required for checkout
- ✅ Plan ID validated against database
- ✅ User can only purchase plans for themselves

## Testing

For local testing:

1. Use Dodo's test API credentials
2. Use test card numbers provided by Dodo
3. Verify webhook delivery using Dodo's dashboard tools
