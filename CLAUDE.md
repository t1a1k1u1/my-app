@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the dev server (Next.js, Turbopack)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint
- `npx prisma generate` — regenerate the Prisma client after schema changes
- `npx prisma migrate dev` — create/apply a migration against `DATABASE_URL` (requires a running Postgres instance)
- `npx prisma studio` — browse the DB

No test runner is configured yet. When tests are added, document here how to run a single test.

## Source of truth

`docs/spec.md` is the authoritative spec for this app ("たべごろ" — a personal-use fridge/food-inventory tracker to reduce food waste by surfacing expiration dates). Read it in full before implementing anything — it defines the data model, API routes, screens, and explicit dos/don'ts. Key constraints called out in the spec that are easy to violate by "obvious" default choices:

- **No quantity/unit fields anywhere.** Multiple units of the same ingredient in stock are represented as multiple separate `StockItem` rows, never a count field. Do not add quantity/unit/price fields to the data model or any screen/API.
- **Stock deletion is always a soft delete** (`deleted_at` timestamp on `StockItem`). Never physically delete stock rows.
- **Expiry remaining-days is never cached/snapshotted.** It's computed on every read as `registered_at + Ingredient.expiry_days − today`, always against the *current* master data value, so editing an ingredient's `expiry_days` immediately changes remaining-days for all existing stock referencing it.
- **Ingredient (master data) deletion is conditional:** if any `StockItem` (including soft-deleted ones) references the ingredient, deletion must set `is_active = false` instead of physically deleting the row. Only physically delete when there are zero referencing `StockItem` rows.
- **「よく登録するもの」(frequently registered) ranking includes soft-deleted `StockItem` rows** in its count — consumption history counts toward "frequently used", not just current stock.
- **No role-based access control.** This is a single-user app (the developer only); any authenticated session has full access to both regular and admin (`/admin/*`) screens. Do not add roles/permissions.
- **No scope creep:** no recipe suggestions, nutrition calculation, or external recipe API integration — explicitly out of scope.

## Git commit practices

Commit in small, granular increments as work progresses (e.g. per logical change — a schema migration, one API route, one screen — rather than batching many changes into one large commit). This keeps history reviewable and makes it easy to bisect or revert a single piece of functionality.

## Architecture

- **Stack:** Next.js (React, App Router, TypeScript) with API Routes as the backend, in a single repo. Tailwind CSS for styling. PostgreSQL via Prisma ORM. Auth via NextAuth.js Credentials Provider (email+password, bcrypt-hashed), long-lived JWT sessions (~30 days) so a PWA doesn't force frequent re-login. Icon images go to a cloud object store (Vercel Blob or S3-compatible), referenced by URL. Deployed on Vercel with managed Postgres.
- **Data model** (`prisma/schema.prisma`, see spec §5 for full field list): `User` → owns many `StockItem`. `Ingredient` (master data) → referenced by many `StockItem`, has many `IngredientAlias` (search synonyms). `StockItem` has no quantity — one row per physical unit in stock, `registered_at` is the expiry-calculation anchor, `deleted_at` marks logical removal.
- **Screens** (spec §4): `/login`, `/stock` (default post-login view, sorted by soonest-expiring, 3-color-coded: red=expired, yellow=≤3 days left, normal=otherwise), `/stock/new` (incremental fuzzy search + registration date), `/admin/ingredients` (+ `/new`, `/:id/edit`) for master data CRUD.
- **API surface** (spec §6): REST-ish routes under `/api/stock` and `/api/ingredients`, plus NextAuth's own `/api/auth/*`. Ingredient search (`GET /api/ingredients?q=&mode=frequent|recent`) powers the incremental search UI — `mode=frequent` and `mode=recent` are the two default-state suggestion lists shown before the user types anything.
- **Build order recommended by the spec** (§13): Prisma schema → auth → ingredient master CRUD/admin screens → stock CRUD/screens → search + expiry color-coding → PWA support (manifest, service worker).
