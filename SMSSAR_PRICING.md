# SMSSAR Pricing & Plan System

## Overview

The SMSSAR system provides discounted pricing and potentially different feature limits compared to regular SELLER users. When a user with role `SMSSAR` performs any action (creating listings, purchasing add-ons, upgrading plans), the system automatically applies SMSSAR-specific pricing and limits.

## Database Fields

All pricing and limit fields have parallel SMSSAR versions in the `Plan` table:

| Field                 | SMSSAR Field                | Purpose                        |
| --------------------- | --------------------------- | ------------------------------ |
| `price`               | `smmsarPrice`               | Subscription plan price        |
| `listings`            | `smssarListings`            | Max number of listings allowed |
| `maxFeaturedListings` | `smssarMaxFeaturedListings` | Max featured listings          |
| `maxImagesPerListing` | `smssarMaxImagesPerListing` | Max images per listing         |
| `maxVideosPerListing` | `smssarMaxVideosPerListing` | Max videos per listing         |

### PurchaseProduct Table Additional Fields

| Field         | Purpose                           |
| ------------- | --------------------------------- |
| `price`       | Regular seller price              |
| `smmsarPrice` | SMSSAR-specific price for add-ons |

### Purchase Table Additional Fields

| Field              | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `totalPrice`       | Total price paid by user (seller or SMSSAR) |
| `totalPriceSmssar` | Always stores SMSSAR base price equivalent  |
| `unitPrice`        | Unit price paid                             |

## Current SMSSAR Pricing (MAD currency)

### Plans

- **Free Plan**: 0 MAD
  - Listings: Unlimited (NULL)
  - Featured: 0
  - Images/listing: 3
  - Videos/listing: 0

- **Pro Plan**: 79 MAD (20% discount from 99 MAD)
  - Listings: 10
  - Featured: 3
  - Images/listing: 10
  - Videos/listing: 2

- **Premium Plan**: 239 MAD (20% discount from 299 MAD)
  - Listings: Unlimited (NULL)
  - Featured: 10
  - Images/listing: 30
  - Videos/listing: 5

### Add-ons

All add-on products have SMSSAR pricing configured in the database.

## How the System Works

### 1. Role-Based Pricing Resolution

The `resolvePlanForRole()` function in [src/lib/role-pricing.ts](src/lib/role-pricing.ts) automatically selects the appropriate field based on user role:

```typescript
// For SMSSAR users, it uses smmsarPrice if available, falls back to price
// For SELLER users, it uses price

resolvePlanForRole(plan, session.user.role);
// Returns plan with effective fields for the user's role
```

### 2. Where SMSSAR Pricing is Applied

#### Server-Side (Automatic)

- **Listing Creation** (`/api/properties/route.ts`)
  - Enforces `smssarListings` limit
  - Enforces `smssarMaxImagesPerListing` limit
  - Enforces `smssarMaxVideosPerListing` limit
  - Enforces `smssarMaxFeaturedListings` limit

- **Listing Updates** (`/api/properties/[id]/route.ts`)
  - Same limit enforcement as creation

- **Plan Checkout** (`/api/payments/plans/dodo-checkout/route.ts`)
  - Uses `smmsarPrice` for checkout

- **Purchase Checkout** (`/api/payments/purchase/route.ts`)
  - Uses `smmsarPrice` for each add-on
  - Calculates correct total using `resolvePurchaseProductPrice()`

- **Purchase Webhook** (`/api/webhooks/dodo/route.ts`)
  - Receives user role from metadata
  - Creates Purchase record with both `totalPrice` and `totalPriceSmssar`
  - Uses `resolvePurchaseProductPrice()` for per-unit price

#### Frontend (Display Only)

- **Pricing Page** (`[locale]/(public)/pricing/page.tsx`)
  - Shows correct plan prices for SMSSAR users

- **Plan Page** (`[locale]/(dashboard)/dashboard/smssar/plan/page.tsx`)
  - Shows correct SMSSAR pricing and limits

- **Purchase Page** (`[locale]/(dashboard)/dashboard/smssar/purchases/page.tsx`)
  - Shows correct SMSSAR add-on prices

## Implementation Details

### Role Detection

On every request, the system checks `session.user.role`:

```typescript
// In auth middleware and session handlers
if (session.user.role === "SMSSAR") {
  // Use SMSSAR pricing
} else if (session.user.role === "SELLER") {
  // Use seller pricing
}
```

### Handling NULL Values

Some fields like `listings` can be NULL (unlimited). The resolution function handles this:

```typescript
// NULL = unlimited
listings: pickValue(plan.listings, plan.smssarListings, role);
// Returns SMSSAR value if set, falls back to seller value, then null

// In enforcement:
const planLimit = buildPlanAllowance(effectivePlan.listings, extraListings);
// If listings is null, returns Infinity (unlimited)
```

### Purchase Record Calculation

When a SMSSAR user purchases:

```typescript
// Determine effective price based on role
const effectiveUnitPrice = resolvePurchaseProductPrice(product, userRole);

// Calculate totals
const effectiveTotal = effectiveUnitPrice * quantity;
const smssarUnitPrice = product.smmsarPrice ?? product.price;
const smssarTotal = smssarUnitPrice * quantity;

// Both are stored in Purchase record
await tx.purchase.create({
  unitPrice: effectiveUnitPrice, // What they paid
  totalPrice: effectiveTotal, // What they paid total
  totalPriceSmssar: smssarTotal, // SMSSAR price equivalent
});
```

## Adding New SMSSAR Pricing

### 1. Update Schema

Add new SMSSAR fields when needed:

```prisma
model Plan {
  // New field
  someFeatureName       Int?
  // SMSSAR version
  smssarSomeFeatureName Int?
}
```

### 2. Update Role-Pricing Library

```typescript
// src/lib/role-pricing.ts

type PlanLike = {
  someFeatureName?: number | null;
  smssarSomeFeatureName?: number | null;
  // ... other fields
};

export function resolvePlanForRole(plan, role) {
  return {
    // ... existing fields
    someFeatureName: pickValue(
      plan.someFeatureName,
      plan.smssarSomeFeatureName,
      role,
    ),
  };
}
```

### 3. Use in Enforcement Code

```typescript
const effectivePlan = resolvePlanForRole(userPlan, session.user.role);
// Now use effectivePlan.someFeatureName instead of userPlan.someFeatureName
```

### 4. Update Database

```prisma
UPDATE "Plan"
SET
  "smssarSomeFeatureName" = <value>
WHERE "id" = 'plan_id';
```

## Verification

### Check Current Database Values

Run `prisma studio` and inspect the Plan table for SMSSAR fields:

```bash
npx prisma studio
```

### Test SMSSAR User Pricing

1. Create a test user with role `SMSSAR`
2. Load pricing page - should show `smmsarPrice`
3. Checkout plan - should use `smmsarPrice`
4. Purchase add-on - should use product's `smmsarPrice`
5. Create listing - should enforce `smssarListings` and media limits

### Monitor Backend Logs

The system logs plan limit enforcement:

```
[FEATURED LIMIT] Blocking update: {
  sellerId: "...",
  currentFeatured: 5,
  planFeaturedLimit: 3,
  extraFeatured: 2,
  maxFeatured: 5
}
```

## Files Modified

- `prisma/schema.prisma` - Added SMSSAR fields to Plan, PurchaseProduct, Purchase
- `src/lib/role-pricing.ts` - SMSSAR resolution logic
- `src/app/api/properties/route.ts` - Use `resolvePlanForRole()`
- `src/app/api/properties/[id]/route.ts` - Use `resolvePlanForRole()`
- `src/app/api/payments/purchase/route.ts` - Use `resolvePurchaseProductPrice()`
- `src/app/api/payments/plans/dodo-checkout/route.ts` - Use `resolvePlanForRole()`
- `src/app/api/webhooks/dodo/route.ts` - Calculate both prices, use correct role
- `prisma/seed-smssar-pricing.ts` - Seed script to populate SMSSAR pricing

## Troubleshooting

### SMSSAR users seeing wrong pricing

1. Check that user role is correctly set to `SMSSAR` in database
2. Verify `smmsarPrice` and SMSSAR fields are populated in Plan table
3. Check server logs for role detection in API
4. Ensure Prisma client is regenerated: `npx prisma generate`

### Listing limits not enforced for SMSSAR

1. Verify plan fetches with `resolvePlanForRole()`
2. Check if plan `smssarListings` is NULL (unlimited)
3. Verify Purchase records exist with `ACTIVE` status
4. Check that `buildPlanAllowance()` is called with extra quantities

### Purchase prices don't match

1. Verify product `smmsarPrice` is set in database
2. Check webhook metadata includes correct `userRole`
3. Ensure `resolvePurchaseProductPrice()` is used in checkout
4. Verify both `totalPrice` and `totalPriceSmssar` are calculated
