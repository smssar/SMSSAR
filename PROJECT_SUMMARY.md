# Kirae/Smssar — Complete Project Overview

## 📋 Project Summary

**Kirae/Smssar** is a production-ready, multilingual house rental marketplace built with Next.js App Router, TypeScript, Tailwind CSS, and PostgreSQL via Prisma ORM.

### Core Information

- **Status**: Active marketplace platform
- **Languages**: English, Arabic, French (with RTL support for Arabic)
- **Framework**: Next.js 16.2.4 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5 (beta) with Credentials & Google OAuth
- **Payments**: Dodo Payments integration with webhook handling
- **Email**: Resend for transactional emails
- **Styling**: Tailwind CSS + shadcn-style components
- **Media**: Cloudinary integration

---

## 🏗️ Architecture Overview

### Directory Structure

```
/src
├── app/                          # Next.js App Router routes
│   ├── [locale]/                 # Locale-based routing (en, ar, fr)
│   │   ├── /landing-page.tsx    # Marketing homepage
│   │   ├── /(public)/           # Public routes
│   │   │   ├── contact/         # Contact form
│   │   │   ├── about/           # About page
│   │   │   ├── properties/       # Property listings
│   │   │   ├── pricing/         # Pricing plans
│   │   │   └── payments/        # Payment flows
│   │   ├── /(auth)/             # Auth pages (login, register)
│   │   ├── /(dashboard)/        # Protected seller/user dashboard
│   │   ├── become-seller/       # Seller onboarding
│   │   └── suspend/             # Suspension page
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── payments/           # Payment processing (Dodo)
│   │   ├── webhooks/dodo/      # Dodo Payments webhooks
│   │   ├── contact/            # Contact form backend
│   │   ├── users/              # User endpoints (me, profile)
│   │   ├── properties/         # Property CRUD
│   │   ├── admin/              # Admin operations
│   │   ├── plans/              # Subscription plans
│   │   ├── subscriptions/      # Subscription management
│   │   ├── ads/                # Ad management
│   │   ├── cities/             # City management
│   │   ├── neighborhoods/      # Neighborhood management
│   │   ├── categories/         # Property type management
│   │   └── property-types/     # Property type listing
│   ├── layout.tsx              # Root layout (HTML structure)
│   └── page.tsx                # Root page (redirects to locale)
├── components/
│   ├── ui/                     # Base UI components (Card, Button, etc.)
│   ├── layout/                 # Layout components (navbar, footer)
│   ├── admin/                  # Admin dashboard components
│   ├── auth/                   # Auth components (signin, signup buttons)
│   ├── dashboard/              # Dashboard components
│   ├── property/               # Property card components
│   ├── payment/                # Payment components
│   ├── media/                  # Media/image components
│   ├── navigation/             # Nav components (language switcher, theme)
│   ├── shared/                 # Shared utility components
│   ├── dashboard-shell.tsx     # Dashboard layout wrapper
│   └── providers.tsx           # App context providers
├── lib/
│   ├── prisma.ts              # Prisma client with pool adapter
│   ├── messages.ts            # i18n strings (en, ar, fr)
│   ├── locales.ts             # Locale utilities (detection, types)
│   ├── site-data.ts           # Mock data (properties, plans, testimonials)
│   ├── i18n.ts                # Translation helper
│   ├── format.ts              # Formatting utilities
│   ├── cloudinary.ts          # Cloudinary integration
│   ├── resend.ts              # Resend email setup
│   ├── api-utils.ts           # API response helpers
│   ├── utils.ts               # General utilities (cn)
│   ├── getActiveSubscription.ts   # Subscription logic
│   ├── ensure-plan.ts         # Plan enforcement
│   ├── ensure-free-plan.ts    # Free plan creation
│   ├── user-restriction.ts    # Suspension/ban logic
│   ├── phone.ts               # Phone number utilities
│   ├── email-verification.ts  # Email verification logic
│   ├── ad-utils.ts            # Ad campaign utilities
│   └── billing-email.ts       # Billing emails
├── auth.ts                     # NextAuth configuration
├── proxy.ts                    # Middleware for locale/auth routing
└── generated/prisma/          # Auto-generated Prisma types

/prisma
├── schema.prisma              # Database schema definition
├── seed.ts                    # Database seed script
└── migrations/                # Migration history

/public                        # Static assets

Root config files:
- package.json                 # Dependencies
- tsconfig.json               # TypeScript config
- next.config.ts              # Next.js config
- eslint.config.mjs           # ESLint config
- postcss.config.mjs          # PostCSS config
```

---

## 🗄️ Database Schema

### Core Models

#### **User**

- ID, name, email, avatar
- Authentication: passwordHash, emailVerified
- Profile: phone, city, bio
- Roles: USER, SELLER, ADMIN
- Status: ACTIVE, PENDING, SUSPENDED, BANNED
- Restrictions: suspendedAt, suspendedUntil, suspendedMessage, suspendedBy, bannedMessage
- Subscription: planId, featuredproperties

**Relations**: properties, favorites, accounts, sessions, subscriptions, ads

#### **Subscription**

- User + Plan linking
- Status: ACTIVE, CANCELLED, EXPIRED, PENDING, WiLL_EXPIRE, SCHEDULED, DISABLED
- Payment tracking: paymentId, dodoSubscriptionId, localSessionId
- Refund tracking: refunded, refund_id
- Dates: startDate, endDate

#### **Plan**

- Id, title (en/ar/fr), description (en/ar/fr), price
- Limits: listings (null = unlimited), featured, ads, adsduration, maxFeaturedListings, maxImagesPerListing, maxVideosPerListing

**Plans in system**: free, pro, premium

#### **Property**

- Title, description, location (city, neighborhood)
- Physical: area, rooms, bathrooms, price
- Classification: propertyTypeId, forSale, featured, priceType (MONTHLY/DAILY)
- Media: imageUrl, videoUrl
- Seller reference: sellerId
- Relations: propertyType, seller, media, favorites, ads

#### **PropertyType**

- Name (en/ar/fr), slug
- Examples: apartments, villas, houses, luxury, family

#### **City & Neighborhood**

- Localized names (en/ar/fr), slugs
- Neighborhood linked to City

#### **Ad**

- User + plan/property linking
- Title, description, slug
- Status: DRAFT, SCHEDULED, RUNNING, PAUSED, ENDED, CANCELLED
- Budget tracking: budget, spentAmount, pricePerDay, impressions, clicks, conversions
- Featured ads: featured, featuredUntil
- Dates: startAt, endAt

#### **Favorite**

- User + Property linking (bookmarks)

#### **Account** (NextAuth)

- OAuth provider linking

#### **Session** (NextAuth)

- Session token management

#### **VerificationToken**

- Email/phone verification tokens

#### **Media**

- Property media files

---

## 🔐 Authentication & Authorization

### Authentication Methods

1. **Credentials** (email + password)
   - Users must be email-verified
   - Passwords hashed with bcryptjs
2. **Google OAuth**
   - Auto-creates user on first login
   - Automatically assigns free plan
   - Email verified via OAuth

### Sessions

- **Strategy**: JWT tokens
- **Provider**: NextAuth v5 beta
- **User fields in session**: id, email, name, role, planId, avatar
- **Roles**: USER, SELLER, ADMIN

### Protected Routes

- `/[locale]/dashboard/*` — Requires authentication
- `/[locale]/become-seller/*` — Requires active subscription
- `/[locale]/check-plan/*` — Redirect for expired subscriptions

### User Restrictions (via middleware)

- **Suspension**: Temporary ban with message, can expire
- **Bans**: Permanent with message
- **Expired subscriptions**: Redirects to `/check-plan`

---

## 💳 Payments & Subscriptions

### Dodo Payments Integration

#### Files

- [src/app/api/payments/dodo-checkout/route.ts](src/app/api/payments/dodo-checkout/route.ts) — Creates checkout session
- [src/app/api/webhooks/dodo/route.ts](src/app/api/webhooks/dodo/route.ts) — Webhook handler for payment completion
- [src/components/payment/dodo-checkout-button.tsx](src/components/payment/dodo-checkout-button.tsx) — Checkout button component
- [src/app/[locale]/(public)/payments/](<src/app/[locale]/(public)/payments/>) — Payment flow pages

#### Flow

1. User clicks "Get this plan"
2. Routed to `/[locale]/payments?plan={planId}`
3. Clicks "Pay now" button
4. Redirected to Dodo's hosted checkout
5. After payment, Dodo sends webhook to `/api/webhooks/dodo`
6. User's subscription → plan updated in database
7. User redirected to `/payments/success`

#### Security

- ✅ HMAC-SHA256 webhook signature verification
- ✅ User authentication required
- ✅ Plan ID validated against database
- ✅ Idempotency guards (prevent duplicate payments)

#### Subscription Logic

- **getActiveSubscription**: Checks if user has valid subscription
- **Handles**: Free plan auto-creation, expiration detection, plan sync
- **Expired subscriptions**: Auto-redirect to `/check-plan`

---

## 🌍 Localization & i18n

### Supported Locales

- **en** — English (LTR)
- **ar** — Arabic (RTL)
- **fr** — French (LTR)

### Implementation

- **Detection**: Cookie > Accept-Language header > default (en)
- **Application**: Via `[locale]` dynamic route segment
- **Direction**: Auto-set via `getDirection(locale)` → RTL for Arabic
- **Storage**: Messages object organized by locale in [src/lib/messages.ts](src/lib/messages.ts)

### Message Keys

- Common UI labels (nav, dashboard, common terms)
- Page-specific copy (home, contact, about, pricing, admin)
- Form validation, placeholders, CTAs
- Email templates (contact, billing)

### Mock Data

- [src/lib/site-data.ts](src/lib/site-data.ts) contains localized:
  - Properties (6 featured/mock listings)
  - Plans (free, pro, premium)
  - Testimonials
  - Stats
  - Property types

---

## 📧 Email Integration (Resend)

### Contact Form Emails

- **Contact page**: [src/app/[locale]/(public)/contact/page.tsx](<src/app/[locale]/(public)/contact/page.tsx>)
- **API handler**: [src/app/api/contact/route.ts](src/app/api/contact/route.ts)

**Emails sent**:

1. Admin notification (prefixed with "[Contact Form]")
2. User confirmation (if email provided) — only when valid address given

### Configuration

- [src/lib/resend.ts](src/lib/resend.ts) — Resend client setup
- [src/lib/billing-email.ts](src/lib/billing-email.ts) — Billing-related emails

---

## 🎨 UI & Components

### Component Structure

#### Base UI Components (`ui/`)

- Button, Card, Input, Select, Badge, Dialog, Tabs, etc.
- shadcn/ui-inspired styling
- Fully responsive with Tailwind CSS

#### Layout Components

- **SiteNavbar**: Responsive navigation with language/theme switchers
- **SiteFooter**: Site footer with links
- **DashboardShell**: Dashboard layout wrapper
- **SectionHeading**: Section title component

#### Feature Components

- **PropertyCard**: Property listing display
- **BecomeSellerButton**: CTA for becoming seller
- **MediaSwiper**: Image carousel (Swiper.js)
- **Admin panels**: Cities, neighborhoods, property types, plans, users
- **StatGrid**: Dashboard statistics

### Styling

- **Tailwind CSS** v4 with PostCSS
- **Dark mode**: Supported via theme toggle
- **Responsive**: Mobile-first design
- **Icons**: lucide-react + react-icons

---

## 🔌 API Routes

### Authentication (`/api/auth/`)

- NextAuth handlers (signin, callback, signout, etc.)

### User (`/api/users/`)

- `me` — Returns authenticated user profile
- Profile management

### Properties (`/api/properties/`)

- CRUD operations (create, read, update, delete listings)
- Search/filter listings

### Payments (`/api/payments/`)

- `dodo-checkout` — Create Dodo checkout session
- Returns checkout URL and session ID

### Webhooks (`/api/webhooks/dodo/`)

- Payment completion webhook
- Subscription update webhook
- Refund webhook
- HMAC signature verification

### Admin (`/api/admin/`)

- User management (suspend, ban)
- Dashboard data

### Plans (`/api/plans/`)

- List available plans

### Subscriptions (`/api/subscriptions/`)

- Subscription CRUD

### Contact (`/api/contact/`)

- Contact form submission + email sending

### Cities, Neighborhoods, Property-Types (`/api/*/`)

- CRUD for each entity

---

## 🛠️ Key Libraries & Tools

| Library                      | Purpose                              |
| ---------------------------- | ------------------------------------ |
| **next**                     | React framework with App Router      |
| **next-auth**                | Authentication (OAuth + credentials) |
| **prisma**                   | ORM for PostgreSQL                   |
| **tailwindcss**              | CSS framework                        |
| **typescript**               | Type safety                          |
| **bcryptjs**                 | Password hashing                     |
| **resend**                   | Email delivery                       |
| **cloudinary**               | Media hosting                        |
| **libphonenumber-js**        | Phone validation                     |
| **swiper**                   | Image carousel                       |
| **lucide-react**             | SVG icons                            |
| **react-icons**              | Additional icons                     |
| **sonner**                   | Toast notifications                  |
| **@auth/prisma-adapter**     | Prisma adapter for NextAuth          |
| **@dodopayments/nextjs**     | Dodo Payments integration            |
| **class-variance-authority** | Component styling variants           |

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Setup Steps

1. **Install dependencies**

```bash
npm install
```

2. **Create `.env.local`**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kirae

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Google OAuth
GOOGLE_ID=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# Dodo Payments
DODO_API_KEY=your_dodo_api_key
DODO_MERCHANT_ID=your_dodo_merchant_id
DODO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email
RESEND_API_KEY=your_resend_api_key

# Media
CLOUDINARY_URL=cloudinary://key:secret@account
```

3. **Setup database**

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
node prisma/seed.ts
```

4. **Start dev server**

```bash
npm run dev
```

Visit http://localhost:3000

### Available Commands

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Run production server
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript
npm run prisma:studio  # Open Prisma Studio (DB browser)
```

---

## 📝 Key Files Reference

### Core Logic

- [src/auth.ts](src/auth.ts) — NextAuth configuration
- [src/proxy.ts](src/proxy.ts) — Middleware for routing/locale/auth
- [src/lib/prisma.ts](src/lib/prisma.ts) — Prisma client with pooling
- [src/lib/getActiveSubscription.ts](src/lib/getActiveSubscription.ts) — Subscription validation

### Features

- [src/lib/messages.ts](src/lib/messages.ts) — i18n strings (2000+ lines)
- [src/lib/site-data.ts](src/lib/site-data.ts) — Mock data
- [src/app/[locale]/landing-page.tsx](src/app/[locale]/landing-page.tsx) — Homepage

### Forms & API

- [src/app/api/contact/route.ts](src/app/api/contact/route.ts) — Contact form API
- [src/app/api/webhooks/dodo/route.ts](src/app/api/webhooks/dodo/route.ts) — Payment webhooks

### UI

- [src/components/layout/site-navbar.tsx](src/components/layout/site-navbar.tsx) — Navigation bar
- [src/components/property/property-card.tsx](src/components/property/property-card.tsx) — Property display

---

## 🔗 Dependencies

### Production

- next (16.2.4) — Framework
- react (19.2.4) — UI library
- typescript (5) — Type safety
- prisma (7.7.0) — ORM
- tailwindcss (4) — Styling
- next-auth (5.0.0-beta.31) — Auth
- resend (6.12.3) — Email
- cloudinary (2.10.0) — Media
- bcryptjs (3.0.3) — Hashing
- pg (8.20.0) — PostgreSQL driver
- swiper (12.1.4) — Carousel

### Development

- eslint (9) — Linting
- @types/\* — TypeScript definitions

---

## 🏢 Project Status & Roadmap

### Current Features ✅

- ✅ Multi-language support (en/ar/fr)
- ✅ User authentication (credentials + Google)
- ✅ Seller dashboard with property listings
- ✅ Admin dashboard with management panels
- ✅ Contact form with email delivery
- ✅ Payment integration (Dodo Payments)
- ✅ Subscription plans (free, pro, premium)
- ✅ Property search/filter
- ✅ Favorites/bookmarks
- ✅ RTL support for Arabic
- ✅ Dark mode toggle

### Known Limitations

- Mock data used for property search
- No automated tests (add Jest/Playwright as needed)
- Social links are placeholders in contact page

### Suggested Next Steps

1. Replace placeholder social URLs
2. Add automated tests (API + webhook tests)
3. Add image upload to Cloudinary
4. Add advanced property filtering
5. Add seller messaging system
6. Add analytics tracking
7. Add SMS notifications
8. Add mobile app (React Native)

---

## 📊 Project Statistics

- **Total Files**: ~150+ files
- **Total Components**: ~40+ components
- **Database Models**: 13 models
- **API Routes**: 15+ route groups
- **Locales Supported**: 3 (en, ar, fr)
- **Authentication Methods**: 2 (credentials, Google)
- **External Integrations**: 3 (Resend, Cloudinary, Dodo Payments)

---

## 🎯 Conclusion

Kirae/Smssar is a comprehensive, production-ready marketplace platform with:

- Strong foundation in Next.js and TypeScript
- Multi-language support with RTL localization
- Secure authentication and authorization
- Integrated payments processing
- Responsive, accessible UI
- Modular, reusable component architecture

The codebase is well-organized, properly typed, and ready for scaling to handle production traffic.
