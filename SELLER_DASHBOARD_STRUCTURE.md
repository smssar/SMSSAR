# Seller Dashboard Structure - Reference Guide

This document outlines the complete structure of the Seller Dashboard, which you can replicate for the Smssar Dashboard.

## 1. FOLDER STRUCTURE & ROUTING

### Main Dashboard Route

```
/src/app/[locale]/(dashboard)/
├── layout.tsx                           # Parent layout with base auth check
└── dashboard/
    ├── layout.tsx                       # NOT EXISTS - dashboard doesn't have layout at this level
    ├── page.tsx                         # NOT EXISTS
    ├── admin/
    │   ├── layout.tsx                   # Admin dashboard layout
    │   ├── page.tsx                     # Admin overview
    │   ├── cities/
    │   ├── favorites/
    │   ├── listings/
    │   ├── pages/
    │   ├── plans/
    │   ├── profile/
    │   ├── property-types/
    │   ├── refunds/
    │   ├── reports/
    │   ├── users/
    │   └── whatsappMessages/
    ├── profile/
    │   └── page.tsx                     # Generic user profile (not seller-specific)
    ├── seller/
    │   ├── layout.tsx                   # Seller dashboard layout with nav sidebar
    │   ├── page.tsx                     # Seller overview/dashboard
    │   ├── add/
    │   │   └── page.tsx                 # Add property page
    │   ├── billing/
    │   │   └── page.tsx                 # Billing history/invoices
    │   ├── favorites/
    │   │   └── page.tsx                 # Favorites management
    │   ├── listings/
    │   │   └── page.tsx                 # All seller listings
    │   ├── plan/
    │   │   └── page.tsx                 # Plan management/upgrade
    │   ├── profile/
    │   │   └── page.tsx                 # Seller profile editing
    │   ├── purchases/
    │   │   └── page.tsx                 # Seller purchases (add-ons)
    │   └── subscriptions/
    │       └── page.tsx                 # Subscription management
    └── smssar/
        ├── layout.tsx                   # Smssar dashboard layout (partial setup)
        ├── page.tsx                     # Smssar overview
        ├── add/
        │   └── page.tsx
        ├── listings/
        │   └── page.tsx
        ├── plan/
        │   └── page.tsx
        └── (rooms for billing, profile, etc.)
```

### Key Notes on Routing:

- Uses **App Router** (Next.js 13+)
- Dynamic locale segment: `[locale]` for i18n (en/ar/fr)
- Route groups `(dashboard)` isolate dashboard routes
- Each role (seller, admin, smssar) has its own layout with specific navigation
- Simple structure: each feature is just a `page.tsx` (no nested layouts needed for seller pages)

---

## 2. AUTHENTICATION & AUTHORIZATION CHECKS

### Parent Layout - `/src/app/[locale]/(dashboard)/layout.tsx`

**Location**: `/src/app/[locale]/(dashboard)/layout.tsx`

**Responsibility**:

- Basic auth check - redirects unauthenticated users to login
- All protected dashboard routes go through this first

```typescript
if (!session?.user?.id) {
  redirect(`/${locale}/login`);
}
```

### Seller Dashboard Layout - `/src/app/[locale]/(dashboard)/dashboard/seller/layout.tsx`

**Location**: `/src/app/[locale]/(dashboard)/dashboard/seller/layout.tsx`

**Responsibility**:

- Role-based access control (SELLER/SMSSAR only)
- Redirect logic:
  - If ADMIN → redirect to `/dashboard/admin`
  - If USER → redirect to `/dashboard/profile`
  - If SESSION_NONE → already handled by parent (login page)

```typescript
if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
  if (session.user.role === "ADMIN") {
    redirect(`/${locale}/dashboard/admin`);
  }
  redirect(`/${locale}/dashboard/profile`);
}
```

**Key Feature**: Layout also handles building the sidebar navigation items and passes them to DashboardShell component

### Individual Page Checks

Each page (e.g., `seller/page.tsx`, `seller/add/page.tsx`) also performs auth checks:

```typescript
const session = await auth();

if (!session?.user?.id) {
  redirect(`/${locale}/login`);
}

if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
  redirect(`/${locale}/dashboard/profile`);
}
```

### Auth Module Location

**Location**: `/src/auth.ts`

**Key User Type Definition**:

```typescript
interface User {
  role: "USER" | "SELLER" | "SMSSAR" | "ADMIN";
  planId: string;
  image?: string | null;
  phone?: string | null;
}

interface Session {
  user: {
    id: string;
    role: "USER" | "SELLER" | "SMSSAR" | "ADMIN";
    planId: string;
    phone: string | null;
  } & DefaultSession["user"];
}
```

---

## 3. NAVIGATION & SIDEBAR COMPONENT

### DashboardShell Component

**Location**: `/src/components/layout/dashboard-shell.tsx`

**Type**: Client component (`"use client"`)

**Props**:

```typescript
interface DashboardShell {
  locale: Locale;
  title: string; // e.g., "Seller dashboard", "Admin dashboard"
  roleLabel: string; // e.g., "Seller account"
  items: DashboardNavItem[]; // Navigation links
  children: ReactNode; // Page content
}

interface DashboardNavItem {
  label: string; // Display text
  href: string; // Link destination
  icon?: ReactNode; // Lucide React icon
}
```

**Features**:

- Fixed sidebar on desktop (sticky, max-h-screen overflow)
- Mobile drawer (hidden by default, toggled with Menu button)
- Active link detection using `usePathname()`
- Home and Logout buttons in footer
- Language switcher integration
- RTL/LTR support (sidebar adjusts for Arabic)

### How Navigation Is Built in Seller Layout

**Location**: `/src/app/[locale]/(dashboard)/dashboard/seller/layout.tsx` (lines 45-96)

Example from code:

```typescript
const items = [
  {
    label: messages.dashboard.seller.overview,
    href: `/${locale}/dashboard/seller`,
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.listings,
    href: `/${locale}/dashboard/seller/listings`,
    icon: <FolderHeart className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.addHouse,
    href: `/${locale}/dashboard/seller/add`,
    icon: <FilePlus2 className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.subscriptions,
    href: `/${locale}/dashboard/seller/subscriptions`,
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.billing ?? "Billing",
    href: `/${locale}/dashboard/seller/billing`,
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.plan,
    href: `/${locale}/dashboard/seller/plan`,
    icon: <Settings2 className="h-4 w-4" />,
  },
  {
    label: locale === "ar" ? "الشراء" : "Purchases",
    href: `/${locale}/dashboard/seller/purchases`,
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    label: messages.dashboard.seller.profile,
    href: `/${locale}/dashboard/seller/profile`,
    icon: <UserRound className="h-4 w-4" />,
  },
  {
    label: messages.nav.favorites,
    href: `/${locale}/dashboard/seller/favorites`,
    icon: <Heart className="h-4 w-4" />,
  },
];

return (
  <DashboardShell
    locale={locale}
    title={messages.dashboard.seller.title}
    roleLabel={locale === "ar" ? "حساب البائع" : "Seller account"}
    items={items}
  >
    {children}
  </DashboardShell>
);
```

### Icons Used (from lucide-react)

- `BarChart3` - Overview
- `FolderHeart` - Listings
- `FilePlus2` - Add House
- `CreditCard` - Billing/Subscriptions
- `Settings2` - Plan
- `UserRound` - Profile
- `ShoppingBag` - Purchases
- `Heart` - Favorites

---

## 4. SELLER-SPECIFIC COMPONENTS

### Location: `/src/components/seller/`

**Files**:

```
/src/components/seller/
├── cancel-subscription-button.tsx       # Button to cancel subscription
├── index.ts                             # Export barrel
├── seller-limit-notice-card.tsx         # Card showing plan limits reached
├── seller-listings-panel.tsx            # Display seller's listings with delete
├── seller-profile-panel.tsx             # Edit seller profile details
└── seller-property-card.tsx             # Individual property card display
```

### Key Components Details:

#### 1. SellerListingsPanel

- **Type**: Client component
- **Props**: `locale: Locale`, `properties: Property[]`
- **Features**:
  - Lists all seller properties
  - Delete functionality with confirmation
  - Toast notifications for actions
  - Loading states

#### 2. SellerProfilePanel

- **Type**: Client component
- **Props**: `locale: Locale`, `initialSeller: SellerProfile`
- **Features**:
  - Edit name, email, phone, city, bio
  - Password change functionality
  - Phone validation using `libphonenumber-js`
  - Edit/Save modes
  - Country code selector

#### 3. SellerPropertyCard

- Displays individual property in a card format
- Shows property details, price, amenities
- Used in SellerListingsPanel

#### 4. SellerLimitNoticeCard

- Shows notice when plan listing limit is reached
- Shows option to upgrade plan

#### 5. CancelSubscriptionButton

- Button specifically for subscription cancellation
- Confirmation dialog

### Dashboard Component

**Location**: `/src/components/dashboard/`

```
/src/components/dashboard/
└── stat-grid.tsx                       # Display statistics in grid format
```

---

## 5. MESSAGES & LOCALIZATION

### Messages File Location: `/src/lib/messages.ts`

**Structure** (supports en, ar, fr):

```typescript
messages = {
  en: {
    nav: {
      seller: "Seller Dashboard",
      admin: "Admin Dashboard",
      dashboard: "Dashboard",
      favorites: "Favorites",
      profile: "Profile",
    },
    dashboard: {
      seller: {
        title: "Seller dashboard",
        overview: "Overview",
        listings: "My listings",
        subscriptions: "Subscriptions",
        billing: "Billing",
        addHouse: "Add house",
        plan: "Plan",
        profile: "Profile",
        // ... many more seller-specific messages
      },
      admin: {
        title: "Admin dashboard",
        overview: "Overview",
        users: "Users",
        // ... admin-specific messages
      },
    },
    // ... other message sections
  },
  ar: {
    /* Arabic messages */
  },
  fr: {
    /* French messages */
  },
};
```

**Usage in Layout**:

```typescript
const messages = getMessages(locale);
const title = messages.dashboard.seller.title;
const label = messages.dashboard.seller.overview;
```

**For Smssar**: Add a `dashboard.smssar` section to messages similar to seller

---

## 6. COMPLETE PAGE EXAMPLE - Seller Overview Page

**Location**: `/src/app/[locale]/(dashboard)/dashboard/seller/page.tsx`

**Key Pattern**:

```typescript
export default async function SellerOverviewPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const session = await auth();

  // Auth checks
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "SELLER" && session.user.role !== "SMSSAR") {
    redirect(`/${locale}/dashboard/profile`);
  }

  // Data fetching
  const listingCount = await prisma.property.count({
    where: { sellerId: session.user.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planId: true },
  });

  // ... more logic

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

**Key Patterns**:

- Server components (async)
- Fetch data server-side using Prisma
- Auth checks at top
- Use `await params` for locale (Next.js 15 pattern)
- Render UI based on data

---

## 7. ADMIN DASHBOARD REFERENCE

**Location**: `/src/app/[locale]/(dashboard)/dashboard/admin/`

For comparison, Admin Dashboard structure:

```
admin/
├── layout.tsx             # Admin layout with different nav items
├── page.tsx               # Admin overview
├── cities/                # City management
├── favorites/             # Favorites management
├── listings/              # Listings management (admin view)
├── pages/                 # CMS pages management
├── plans/                 # Plan management
├── profile/               # Admin profile
├── property-types/        # Property type management
├── refunds/               # Refunds management
├── reports/               # Reports
├── users/                 # User management
└── whatsappMessages/      # WhatsApp messages
```

**Admin Layout Auth Check** (similar pattern):

```typescript
if (session.user.role !== "ADMIN") {
  if (session.user.role === "SELLER" || session.user.role === "SMSSAR") {
    redirect(`/${locale}/dashboard/seller`);
  }
  redirect(`/${locale}/dashboard/profile`);
}
```

---

## 8. ALREADY EXISTING SMSSAR DASHBOARD

**Location**: `/src/app/[locale]/(dashboard)/dashboard/smssar/`

**Current Status**: Partially implemented

- `layout.tsx` - Created with same pattern as seller (redirects ADMIN, accepts SELLER/SMSSAR)
- `page.tsx` - Overview page
- `add/page.tsx` - Add property
- `listings/page.tsx` - List properties
- `plan/page.tsx` - Plan management

**Missing Pages** (needed to match seller):

- `billing/page.tsx`
- `profile/page.tsx`
- `purchases/page.tsx`
- `subscriptions/page.tsx`
- `favorites/page.tsx`

---

## 9. KEY FILES TO REFERENCE

1. **Auth & Session**: `/src/auth.ts`
2. **Messages/i18n**: `/src/lib/messages.ts`
3. **Locales**: `/src/lib/locales.ts`
4. **Prisma Client**: `/src/lib/prisma.ts`
5. **Dashboard Shell**: `/src/components/layout/dashboard-shell.tsx`
6. **Seller Layout**: `/src/app/[locale]/(dashboard)/dashboard/seller/layout.tsx`
7. **Admin Layout** (for comparison): `/src/app/[locale]/(dashboard)/dashboard/admin/layout.tsx`
8. **Seller Components** (reference): `/src/components/seller/*.tsx`

---

## 10. REPLICATION CHECKLIST FOR SMSSAR DASHBOARD

To complete the Smssar Dashboard following this pattern:

### ✅ Already Done

- [x] `/src/app/[locale]/(dashboard)/dashboard/smssar/layout.tsx`
- [x] `/src/app/[locale]/(dashboard)/dashboard/smssar/page.tsx`
- [x] `/src/app/[locale]/(dashboard)/dashboard/smssar/add/page.tsx`
- [x] `/src/app/[locale]/(dashboard)/dashboard/smssar/listings/page.tsx`
- [x] `/src/app/[locale]/(dashboard)/dashboard/smssar/plan/page.tsx`

### ⚠️ TODO

1. Create missing page files:
   - [ ] `/src/app/[locale]/(dashboard)/dashboard/smssar/billing/page.tsx`
   - [ ] `/src/app/[locale]/(dashboard)/dashboard/smssar/profile/page.tsx`
   - [ ] `/src/app/[locale]/(dashboard)/dashboard/smssar/purchases/page.tsx`
   - [ ] `/src/app/[locale]/(dashboard)/dashboard/smssar/subscriptions/page.tsx`
   - [ ] `/src/app/[locale]/(dashboard)/dashboard/smssar/favorites/page.tsx`

2. Update navigation items in layout.tsx if needed (verify current setup)

3. Add Smssar-specific components to `/src/components/` if needed (or reuse seller components)

4. Add Smssar messages to `/src/lib/messages.ts` if using different labels

---

## Summary

The Seller Dashboard follows a clean, modular architecture:

- **Routing**: Locale-based with route groups
- **Auth**: Layered checks (parent layout → role check → individual pages)
- **Navigation**: DashboardShell component with dynamic items
- **Components**: Reusable seller-specific components
- **Pages**: Simple async server components with Prisma data fetching
- **i18n**: Centralized message management

This same pattern is starting to be replicated for Smssar and can be extended to other dashboard types.
