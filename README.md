# Smssar

A production-ready multilingual house rental marketplace built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn-style UI.

## Features

- English and Arabic support
- Full RTL support for Arabic
- Localized routes such as `/en/properties` and `/ar/properties`
- Public website, auth pages, seller dashboard, and admin dashboard
- Responsive premium SaaS UI
- Mock data with reusable components
- Dark mode ready

## Roles

- User
- Seller
- Admin

## Scripts

- `npm run dev` — start the development server
- `npm run build` — build for production
- `npm run start` — run the production server
- `npm run lint` — run ESLint
- `npm run typecheck` — run the TypeScript compiler
- `npm run prisma:generate` — generate Prisma Client
- `npm run prisma:migrate` — create/apply local PostgreSQL migrations
- `npm run prisma:studio` — open Prisma Studio

## Prisma + PostgreSQL Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
2. Generate Prisma Client:
   - `npm run prisma:generate`
3. Create/apply your first migration:
   - `npm run prisma:migrate -- --name init`
4. (Optional) Browse data:
   - `npm run prisma:studio`

## Notes

- Selected language is stored in a cookie and synced through localized routes.
- Arabic uses RTL layout automatically.
- Seller limits are mocked as Free: 3, Pro: 10, Premium: unlimited.
