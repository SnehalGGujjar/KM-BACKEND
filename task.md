# Kabadi Man — Full Project Build

## Phase 1: Monorepo Scaffold
- [ ] Initialize Turborepo + pnpm workspaces
- [ ] Create `docker-compose.yml` (PostgreSQL + Redis)
- [ ] Create `.env.example` with all env vars
- [ ] Create `turbo.json` + root `package.json`
- [ ] Setup `backend/` Django project (`settings/base.py`, `dev.py`, `prod.py`)
- [ ] Create `requirements/base.txt`, `dev.txt`, `prod.txt`
- [ ] Create `render.yaml` + `Dockerfile`
- [ ] Scaffold `apps/admin-panel/` (Next.js 14)
- [ ] Scaffold `apps/customer-app/` (Expo SDK 51)
- [ ] Scaffold `apps/partner-app/` (Expo SDK 51)
- [ ] Create `packages/shared-types/`, `shared-utils/`, `shared-constants/`

## Phase 2: Django Foundation
- [ ] `cities` app — City model + migrations + seed data
- [ ] `accounts` app — OTPRecord, CustomerProfile, PartnerProfile models + migrations
- [ ] Django admin registrations for all models

## Phase 3: OTP Auth System
- [ ] Abstract OTP provider interface (`BaseOTPService`, `ConsoleOTPService`, etc.)
- [ ] `send-otp` + `verify-otp` API endpoints with rate limiting
- [ ] JWT configuration (SimpleJWT)
- [ ] Customer + Partner registration endpoints
- [ ] Push token update endpoint

## Phase 4: Orders + Pricing
- [ ] `pricing` app — ScrapCategory, CustomerRate, PartnerDefaultRate, PartnerCustomRate, PartnerRateRequest models
- [ ] `orders` app — Order, ScrapItem, OrderRating models + state machine
- [ ] Order lifecycle API endpoints (customer + partner + admin)
- [ ] Rate resolution utility function
- [ ] City-prefixed order ID generation

## Phase 5: Invoices + Wallet
- [ ] `invoices` app — Invoice model + dual invoice generation
- [ ] `wallet` app — PartnerWallet, WalletTransaction models
- [ ] Atomic invoice approval workflow with wallet deduction
- [ ] Admin invoice endpoints (edit, approve)
- [ ] Partner wallet endpoints

## Phase 6: Notifications
- [ ] `notifications` app — NotificationTemplate, Notification models
- [ ] Expo push notification service + Celery task
- [ ] All 11 notification triggers wired to order lifecycle
- [ ] Notification API endpoints (list, read, broadcast)
- [ ] `leads` app scaffold (Phase 2 placeholder)

## Phase 7: Admin Panel (Next.js)
- [ ] Project setup: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Layout: Sidebar + top navbar with global city filter
- [ ] Dashboard page — 8 KPI cards with auto-refresh
- [ ] Orders pages (new, scheduled, ongoing, completed, cancelled, all, detail)
- [ ] Invoice approval page (split-panel UI)
- [ ] Partners pages (list + detail with all 7 sections)
- [ ] Customers pages (list + detail)
- [ ] Pricing page (3 tabs: customer rates, partner rates, rate requests)
- [ ] KPI Analytics page (10 metrics, 4 charts, 7 TAT metrics, export)
- [ ] Notifications page (3 tabs: received, sent, broadcast)
- [ ] Settings page (cities, categories, slots, config, export, security)
- [ ] Info page (static documentation)

## Phase 8: Customer App (Expo)
- [ ] Expo project setup + app.json config
- [ ] Auth flow (phone entry, OTP verify, profile setup)
- [ ] Home screen + Create Pickup flow (3 steps)
- [ ] Current Order screen (live polling, OTP display, status timeline)
- [ ] Order history + detail + rating
- [ ] Pricing, Profile, Notifications screens
- [ ] Recycling Info screen

## Phase 9: Partner App (Expo)
- [ ] Expo project setup + app.json config
- [ ] Auth flow + registration (6-step document upload)
- [ ] Pending/Rejected approval screens
- [ ] Dashboard (online/offline toggle + assigned orders)
- [ ] 10-step Active Order execution flow
- [ ] Wallet screen + pricing + rate request
- [ ] Notifications + profile screens

## Phase 10: Integration + QA
- [ ] Wire all frontend apps to backend APIs
- [ ] End-to-end flow testing
- [ ] Fix integration bugs
- [ ] Write minimum required tests (OTP, state machine, wallet, city filter)

## Phase 11: Render Deployment
- [ ] Configure Render services (Django + Celery)
- [ ] Deploy PostgreSQL + Redis on Render
- [ ] Deploy admin panel to Vercel
- [ ] Set all env vars, verify production URLs
