# GharSewa — Gangtok Home Services

The application is a lean Next.js + TypeScript foundation backed by PostgreSQL through Prisma. The current milestone is Phase 1.5: architecture migration and the approved visual design system.

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to a local or managed PostgreSQL database.
2. Run `npm install`.
3. Run `npm run prisma:generate`.
4. Run `npm run dev`.

No booking, authentication, payment, worker, Admin, or production domain schema is implemented at this stage.

## Structure

- `app/` — Next.js pages and route handlers
- `components/` — shared UI primitives and presentational components
- `lib/` — environment and server infrastructure
- `modules/` — future bounded business modules
- `prisma/` — PostgreSQL Prisma configuration
