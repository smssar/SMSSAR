# SMSSAR System - Quick Reference

## ✅ System Status: FULLY CONFIGURED & OPERATIONAL

All SMSSAR pricing and limits are automatically applied through the backend. No manual configuration needed.

## Key Features Implemented

### ✅ Pricing Tiers

- **Free Plan**: 0 MAD (same for all roles)
- **Pro Plan**: 79 MAD (SMSSAR) vs 99 MAD (Seller)
- **Premium Plan**: 239 MAD (SMSSAR) vs 299 MAD (Seller)

### ✅ Feature Limits (SMSSAR vs Seller)

| Feature            | SMSSAR           | Seller           |
| ------------------ | ---------------- | ---------------- |
| **Listings**       | Same as seller   | Same as seller   |
| **Featured**       | Limited per plan | Limited per plan |
| **Images/listing** | Limited per plan | Limited per plan |
| **Videos/listing** | Limited per plan | Limited per plan |

### ✅ Automatic Features

- Pricing automatically adjusted based on user role
- All limits enforced automatically in backend
- Purchase records track both seller and SMSSAR amounts
- Email receipts show correct pricing
- Discounts applied on frontend and backend

## How Pricing Works

### When User Loads Page

```
User Role: SMSSAR → Display SMSSAR Price
User Role: SELLER → Display Seller Price
User Role: USER   → Not applicable
```

### When User Purchases

```
User Role: SMSSAR → Charge SMSSAR Price
User Role: SELLER → Charge Seller Price
```

### In Database

```
Plan table:
- price (seller)
- smmsarPrice (SMSSAR)

Purchase table:
- totalPrice (what was paid)
- totalPriceSmssar (SMSSAR equivalent for reporting)
```

## API Endpoints Using SMSSAR

### Property Management

- `POST /api/properties` - Enforces SMSSAR listing limits
- `PATCH /api/properties/[id]` - Enforces SMSSAR media limits
- Both use `resolvePlanForRole()` automatically

### Payments - Plans

- `POST /api/payments/plans/dodo-checkout` - Uses SMSSAR pricing

### Payments - Add-ons

- `POST /api/payments/purchase` - Uses SMSSAR pricing
- Includes userRole in metadata for webhook

### Webhooks

- `POST /api/webhooks/dodo` - Payment successful
- Receives userRole from metadata
- Creates Purchase with dual price tracking

## Testing SMSSAR Features

### Quick Test Steps

1. Set user role to `SMSSAR`
2. Load pricing page → See discounted prices
3. Load dashboard → See SMSSAR limits
4. Create listing → Enforces SMSSAR limits
5. Purchase plan → Charged SMSSAR price
6. Purchase add-on → Charged SMSSAR price

### Debug Commands

```bash
# Regenerate types if needed
npx prisma generate

# View database
npx prisma studio

# Check plans table
SELECT id, price, smmsarPrice FROM "Plan";
```

## Architecture Files

- **Core Logic**: `src/lib/role-pricing.ts`
- **Enforcement**: `src/app/api/properties/route.ts`, `[id]/route.ts`
- **Checkout**: `src/app/api/payments/`.ts files
- **Webhooks**: `src/app/api/webhooks/dodo/route.ts`
- **Display**: Dashboard pages under `smssar/`

## Current Pricing Database Values

Applied via `prisma/seed-smssar-pricing.ts`:

- ✅ plan_free: smmsarPrice=0
- ✅ plan_pro: smmsarPrice=79 (79 MAD vs 99 MAD for seller)
- ✅ plan_premium: smmsarPrice=239 (239 MAD vs 299 MAD for seller)

Plus all SMSSAR feature limits configured.

## No Additional Configuration Needed

✅ Schema already has all fields
✅ Logic already checks role automatically
✅ APIs already apply role-based pricing
✅ Database already has SMSSAR values
✅ Frontend already displays correct pricing

**The system is ready to use!** Just ensure users have `SMSSAR` role set correctly.

## For Admins

### To give SMSSAR discount to a user:

```sql
UPDATE "User" SET role = 'SMSSAR' WHERE id = 'user-id';
```

### To view user purchases with pricing:

```sql
SELECT
  u.id, u.name, u.role,
  p.quantity, p.unitPrice, p.totalPrice, p.totalPriceSmssar
FROM "Purchase" p
JOIN "User" u ON p.userId = u.id
WHERE u.role = 'SMSSAR'
ORDER BY p.createdAt DESC;
```

### To adjust SMSSAR pricing:

```sql
UPDATE "Plan"
SET smmsarPrice = <new_price>
WHERE id = 'plan_id';
```

## Important Notes

- SMSSAR users see and are charged discounted prices everywhere
- Their purchase limits are enforced per plan
- Both `totalPrice` and `totalPriceSmssar` are tracked for accounting
- The system is backwards compatible - regular sellers unaffected
- All enforcement happens automatically in backend
