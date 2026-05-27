# Project Overview

This repository contains the Kirae/Smssar web application — a Next.js app (App Router) built with TypeScript, Tailwind CSS and Prisma. It provides an admin dashboard, user authentication, contact pages, and integrations for payments and email delivery.

## High-level Summary

- Framework: Next.js (App Router) with TypeScript
- Styling: Tailwind CSS and shadcn-style UI components
- Authentication: NextAuth (session-based, NextAuth v5 beta in this project)
- Database: PostgreSQL via Prisma ORM
- Email: Resend for transactional emails
- Payments: Dodo Payments webhook handlers (server-side webhooks)
- Additional: Cloudinary integration for media, react-icons for branded icons

## Purpose

The app provides a localized (English/Arabic/French) marketing and admin site for the product, with features including:

- Contact page (supports email and phone submissions)
- Authenticated user profile and session-prefilled forms
- Admin panels for cities, neighborhoods, property types, plans, and users
- Billing flows and webhook handling for subscriptions, payments and refunds

## Key Technologies & Libraries

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma (Postgres migrations located in `/prisma/migrations`)
- NextAuth (authentication/session)
- Resend (email delivery)
- react-icons (UI icons)
- Dodo Payments (webhook handlers under `src/app/api/webhooks/dodo/route.ts`)

## Project Structure (important folders)

- `/src` — main application source
  - `app/` — Next.js App Router routes and pages
    - `[locale]/(public)/contact/page.tsx` — contact page and social links
    - `api/` — API routes (auth, contact, webhooks, users, payments, etc.)
  - `components/` — reusable UI components (auth, admin, dashboard, layout, ui)
  - `lib/` — utilities and integrations (`prisma.ts`, `resend.ts`, `cloudinary.ts`, `i18n.ts`, `messages.ts`)
  - `generated/` — generated Prisma clients

- `/prisma` — Prisma schema and migrations; see `schema.prisma` and `migrations/`
- `/public` — static assets (if present)
- Root config files: `next.config.ts`, `tsconfig.json`, `package.json`, `postcss.config.mjs`

## Notable Files

- `src/lib/messages.ts` — localization strings (en/ar/fr). Adds labels and placeholders used across the UI.
- `src/app/[locale]/(public)/contact/page.tsx` — contact form, prefill logic via `useSession()`, and social icons/links.
- `src/app/api/contact/route.ts` — contact form backend: validates email or phone and sends admin/user emails (user email only when address provided).
- `src/app/api/webhooks/dodo/route.ts` — payment/subscription/refund webhook handlers with DB verification and idempotency guards.
- `src/app/api/users/me/route.ts` — returns authenticated user profile (used to prefill phone in contact form).
- `prisma/seed.ts` — initial seed script used by migrations.

## Environment & Running Locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with variables such as (examples):

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` — NextAuth config
- `RESEND_API_KEY` — Resend API key (if using Resend)
- `CLOUDINARY_URL` — cloudinary connection string (if used)

3. Run Prisma migrations and seed (development):

```bash
npx prisma migrate dev --name init
node prisma/seed.ts
```

4. Start the dev server:

```bash
npm run dev
```

## Where to change common items

- Social links: `src/app/[locale]/(public)/contact/page.tsx` (the `socialLinks` array)
- Localization strings: `src/lib/messages.ts`
- Email sender configuration: `src/lib/resend.ts`
- Webhook logic: `src/app/api/webhooks/dodo/route.ts`

## Testing & Quality

- Type checking: `npm run typecheck` (if configured) or `npx tsc --noEmit`
- Linting: `npm run lint` (if configured)
- Tests: add Jest/Playwright as needed (not present by default)

## Deployment Notes

- Ensure production `DATABASE_URL` and `NEXTAUTH_SECRET` are set.
- Configure webhook endpoint URL with the payments provider (Dodo Payments) and ensure the endpoint is reachable.
- Set Resend and Cloudinary credentials in environment for email/media features.

## Next Steps & Suggestions

- Replace placeholder social profile URLs with real handles in the contact page.
- Add automated tests for webhook handlers and contact API.
- Add a small README badge and `CONTRIBUTING.md` if this will be a collaborative repo.

---

If you want, I can also create a shorter `README.md` for the repo root or add a `CONTRIBUTING.md` and `.env.example` file. Tell me which additional docs you want next.
