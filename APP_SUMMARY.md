# HomeDecide — Application Summary

A personal web app for **evaluating and ranking residential properties** (UK / England & Wales focus) when house-hunting. You add properties, rate them against weighted criteria, and the app computes a normalised score so you can rank and compare candidates objectively. Supports sharing properties with a partner/co-buyer.

## Tech Stack
- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS 3 + CSS variables (custom `--ink`, `--muted`, `--surface`, `--border` design tokens); custom unicode glyph icons
- **DB / ORM:** PostgreSQL via Prisma 5 (hosted on Supabase; `DATABASE_URL` + `DIRECT_URL`)
- **Auth:** Custom — `iron-session` (encrypted cookie `homedecide_session`, 30-day) + `bcryptjs` password hashing. No third-party auth provider.
- **File storage:** Supabase Storage (`src/lib/supabase.ts`) for property photos & documents
- **Data fetching:** `@tanstack/react-query`
- **Validation:** `zod` on API routes
- **Drag & drop:** `@dnd-kit/*` (reordering criteria)
- **Charts:** `recharts`
- **Installed but UNUSED:** `@anthropic-ai/sdk` — no AI features wired up yet (greenfield).

## Core Concept / Scoring
- A user defines **Criteria**, each with: `category`, `ratingType` (`num` = 1–10, or `star` = 1–5), `weight` (float), `required` flag, and `position` (order).
- Each property gets a **Rating** per criterion (value + optional note). Unique on `(userId, propertyId, criterionId)`.
- A **Formula** (one per user) controls scoring: `mode` = `weighted` or `category`, and `normalise` (1–100, the score ceiling).
- **Scoring logic** (`src/lib/scoring.ts`):
  - Normalise each rating to 0–100 (`star`: value/5*100; `num`: value/10*100).
  - Weighted average across rated criteria, scaled to `normalise`.
  - Also computes per-category sub-scores.
  - Score is `null` (incomplete) unless at least `min(3, requiredCount)` required criteria are rated.
  - `scoreColor`/`scoreBg` give traffic-light styling (≥70% green, ≥45% amber, else red).
- **Currency:** hardcoded FX rates (`FX_RATES`) + symbols for GBP/USD/EUR/CHF; `formatPrice` converts between them.

## Data Model (Prisma — `prisma/schema.prisma`)
- **User** — email, name, avatar, passwordHash; owns everything.
- **Property** — rich UK-property fields: address/street/postcode, price+currency, listingUrl, tenure, epc, notes, photos[], internalArea(+unit), bedrooms/bathrooms/livingRooms, hasOffice/Gym/Basement, garden fields (size, orientation, privacy, type, maintenance), neighbourhood(+sub), propertyType, isNewBuild, floor-in-building / totalFloors / isTopFloor / hasLift, building amenities (hasFrontDesk/Pool/Garage/SharedGym/SharedGarden), mapsUrl, listingLinks(JSON).
- **Criterion** — name, category, ratingType, weight, required, position, isDefault.
- **Rating** — value, note; unique per (user, property, criterion).
- **Formula** — mode, normalise, config(JSON); one per user.
- **PropertyShare** — share a property with another user (`canEdit` flag); relations SharedBy/SharedWith.
- **PropertyDocument** — uploaded files (filename, fileUrl, fileSize).
- **PropertyActivityLog** — audit trail (userName, actionType, fieldName, old/newValue) for change history.
- **PropertyBuilding / PropertyFloor / PropertyRoom** — sub-structures for breaking a property into buildings/floors/rooms (Phase 1 structural work, recently added).

New users are seeded with ~18 **default criteria** (`src/lib/defaults.ts`) across categories: *Layout & space, Condition & fabric, Location, Lifestyle fit*.

## App Structure (`src/`)
### Pages (App Router)
- `app/page.tsx` — landing/redirect
- `app/auth/login`, `app/auth/register` — auth pages
- `app/dashboard/layout.tsx` — shell with `Sidebar`
- `app/dashboard/page.tsx` — Overview
- `app/dashboard/properties` — list / `new` / `[id]` (detail) / `[id]/edit`
- `app/dashboard/evaluate` — rate properties against criteria
- `app/dashboard/rankings` — ranked comparison
- `app/dashboard/criteria` — manage criteria
- `app/dashboard/formula` — configure scoring formula
- `app/dashboard/profile` — user profile (recently added)

### API Routes (`app/api/`)
- `auth/` — login, logout, register, me
- `properties/` — CRUD; nested: `[id]/activity`, `[id]/photos`, `[id]/documents` (+`upload`), `[id]/share`, `[id]/buildings` (+`[buildingId]`)
- `criteria/` — CRUD + `reorder`
- `ratings/` — upsert ratings
- `formula/` — GET/PATCH formula
- `user/` — profile update (recently added)

### Components (`src/components/`)
- `shared/Sidebar.tsx` — nav: Overview, Properties, Evaluate, Rankings, Criteria, Formula + profile/logout
- `property/` — PropertyForm, CompareView, EvaluatePanel, ActivityLog, BuildingsPanel, DocumentsPanel, SharePanel, HistoryLink
- `criteria/` — CriteriaManager, FormulaBuilder

### Lib (`src/lib/`)
- `scoring.ts` (scoring + currency), `session.ts` (iron-session auth helpers: `getSession`, `requireAuth`), `prisma.ts`, `supabase.ts`, `defaults.ts` (default criteria), `activityLog.ts` (audit logging), `neighbourhoodColor.ts` (colour-coding by neighbourhood)

## Conventions / Patterns to follow when extending
- API routes: wrap in try/catch, call `requireAuth()` to get `userId`, validate body with a `zod` schema, return `{ data }` on success or `{ error }` with proper HTTP status. Response types: `ApiResponse<T>` in `src/types/index.ts`.
- All data is scoped per-user via `userId`; `onDelete: Cascade` throughout.
- Styling uses Tailwind utility classes + inline `style` with CSS variables for theme colours.
- Types live in `src/types/index.ts`.
- After schema changes: `npm run db:push` (or `db:migrate`), then Prisma client auto-generates.

## Current State (from recent git history)
Recent work: Phase 1 property sub-structure (buildings/floors/rooms), neighbourhood colour-coding, activity log, profile page, user API, sticky headers, compare-page and layout/UI polish. Uncommitted changes touch the property API, dashboard pages, PropertyForm, Sidebar, supabase lib, and add the new `profile` page + `user` API.

## Likely Enhancement Ideas (the AI dependency is unused — ripe for this)
- AI-assisted property analysis: paste a listing URL/description → auto-fill Property fields and suggest ratings.
- AI summary/pros-cons per property or comparative write-up across the shortlist.
- Natural-language querying of the property set ("which has the best light under £800k?").
- Smarter scoring (sensitivity analysis, "what-if" weight tuning).
