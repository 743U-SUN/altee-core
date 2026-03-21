# CLAUDE.md

@AGENTS.md

Next.js 16 App Router + PostgreSQL + Prisma web application.

## Communication

- Respond in Japanese (internal thinking can be in English)

## Quick Commands

```bash
# Initial setup
cp .env.example .env.local  # Edit with your credentials
npm install

# Development (starts PostgreSQL + dev server)
docker compose -f compose.dev.yaml up -d && npm run dev

# Build
npm run build

# Lint & Type check
npm run lint && npx tsc --noEmit

# Database (requires docker compose up first)
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:studio
```

## Architecture

```
app/            Routing & pages
app/actions/    Server Actions (admin, auth, content, media, social, user)
app/demo/       Manual test pages (Server Actions & UI verification)
components/     Shared UI (shadcn/ui based)
lib/            Utilities
lib/queries/    Data access layer (server-only + React.cache)
hooks/          Custom hooks
types/          Type definitions
constants/      Constants
services/       External API wrappers (YouTube, Twitch, Niconico)
```

- Route files: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
- Feature-specific components → colocate with page.tsx / Shared → components/

## Key Files

- `auth.ts` - NextAuth v5 configuration
- `middleware.ts` - Route protection and @handle rewriting
- `prisma/schema.prisma` - Database schema (source of truth)
- `lib/prisma.ts` - Prisma client singleton
- `lib/auth.ts` - requireAuth / requireAdmin / cachedAuth (React.cache wrapping auth)
- `app/sw.ts` - Service Worker (Serwist)

## Environment

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET`, `STORAGE_*` (Cloudflare R2), `NEXT_PUBLIC_STORAGE_URL`, `NEXT_PUBLIC_DOMAIN`
Optional: `TWITCH_*`

## Code Patterns

Data fetching:
- Static → server components + Server Actions
- Interactive → client components + Server Actions + useSWR
- Mutations → Server Actions + useSWR.mutate (optimistic updates)
- Data access layer: lib/queries/ with `import 'server-only'` + `React.cache()`
- Parallel fetching: `Promise.all()` to avoid waterfalls

RSC principles:
- Minimize `use client` / `useEffect` / `useState` — prefer RSC first
- Keep `'use client'` boundaries as narrow as possible
- `params`, `searchParams`, `cookies()`, `headers()` must be **awaited**
- Never pass non-serializable values (Date, Function, Map, Set) to client components
- Date handling at SC→CC boundary: convert to `.toISOString()` in SC → pass as string to CC → restore with `new Date()` in CC. Use `string` in type definitions
- Async client components are invalid
- Use `import 'server-only'` to protect server-only modules

UI / State:
- shadcn/ui + lucide-react, minimize custom UI
- nuqs for URL state, no global state library
- Forms: react-hook-form + Zod, validate on both client and server
- Suspense for fallbacks, next/image, next/link

## Server Actions

Place in app/actions/ as `'use server'` files. Required checklist:
1. Re-verify auth with `requireAuth()` / `requireAdmin()`
2. Validate input server-side with Zod
3. Verify resource ownership (IDOR prevention)
4. Call `revalidatePath()` after writes
5. Return `{ success, data?, error? }` pattern
6. Never wrap `redirect()`/`notFound()` in try-catch (they throw internally)
7. Validate ID params with `cuidSchema` (`lib/validations/shared.ts`)
8. Set max limit on bulk operations (guideline: max 100)
9. Use `lib/queries/` direct queries for read-only data, not Server Actions
10. Verify `revalidatePath()` path matches actual route (watch for missing `@` in `/@handle`)
11. Wrap compound operations (count+create, delete+reorder) in `prisma.$transaction()`

→ Details: docs/GUIDES/SECURITY-GUIDE.md

## Error Handling

- Guard clauses for early return, success path last
- `error.tsx`: route-level error boundary (place in each route)
- `global-error.tsx`: app-wide fallback
- Place `loading.tsx` / `not-found.tsx` in each route
- Server Action errors: return `{ success: false, error }`

## Next.js 16 / React 19

React 19 stable APIs (use alongside existing patterns based on complexity):
- `useActionState()`: simple forms (2-3 fields) → use instead of react-hook-form
- `useOptimistic()`: optimistic UI during actions → use when useSWR is not involved
- `useFormStatus()`: submission status in child components
- `ref` as prop directly (no forwardRef needed)
- `'use cache'`: **stable** in Next.js 16 — declarative caching per function/component (not yet enabled in this project)

When to use which:
- Client-centric forms (real-time validation, dynamic fields, conditional UI) → react-hook-form + Zod
- Server-centric forms (submit → server processes → return result) → useActionState
- Optimistic updates with SWR cache → useSWR.mutate
- Optimistic UI without SWR → useOptimistic

## Security

- 3-layer auth: Middleware (route-level) → Layout (state checks/redirects) → Page/Server Actions (permission checks)
- → Details: docs/GUIDES/SECURITY-GUIDE.md

## Performance

- Avoid barrel imports (import from specific files)
- Route-based code splitting
- Modals, DnD, rich editors → must use `next/dynamic` for lazy loading
- Never use `import *` (especially lucide-react, PrismJS — use named imports only)

## Component & Route Checklist

New component:
- Only add `'use client'` when using useState/useEffect/hooks (audit periodically)
- `import 'server-only'` — required for modules accessing DB/storage/auth
- Validate URLs used in `href` with `isSafeUrl()` (`lib/validations/shared.ts`)
- Check for existing similar components first → prefer shared abstractions

New route:
- `error.tsx` — Admin routes use `AdminErrorFallback` (never expose error.message)
- `loading.tsx` — skeleton UI
- Admin pages: call `requireAdmin()` in SC
- `export const metadata` or `generateMetadata()`

## Shared Utilities

| Utility | Location | Purpose |
|---------|----------|---------|
| `cuidSchema` / `cuidArraySchema` | `lib/validations/shared.ts` | ID validation |
| `queryHandleSchema` / `normalizeHandle()` | `lib/validations/shared.ts` | Handle validation & normalization |
| `isSafeUrl()` | `lib/validations/shared.ts` | URL protocol validation (XSS prevention) |
| `useEditableList()` | `components/user-profile/sections/editors/hooks/useEditableList.ts` | List CRUD (add/delete/move/toggle) |
| `useDebounce()` | `hooks/use-debounce.ts` | Input debounce |
| `useCustomIcons()` | `hooks/use-custom-icons.ts` | Custom icon SWR + resolution |
| `formatFileSize()` | `lib/format-utils.ts` | File size display |
| `AdminErrorFallback` | `components/admin/AdminErrorFallback.tsx` | Admin error boundary (no message exposure) |
| `NotificationFormBase` | `app/dashboard/notifications/notification-form-base.tsx` | Notification/contact form base |
| `AttributeForm` / `AttributePagination` | `app/admin/attributes/components/` | Attribute CRUD shared |
| `ContentModal` | `components/notification/ContentModal.tsx` | Notification/contact modal shared |

## Testing

- No automated test runner — manual verification via `app/demo/*` pages (19 pages)
- Demo pages are accessed directly at `/demo/*`
- Use MCP Playwright browser tools for interactive testing against localhost:3000
- Use `/testing` skill for structured browser testing workflow

## PWA (Progressive Web App) Support

- Use **Serwist** (`@serwist/turbopack`) for Next.js 16 Turbopack PWA integration
- Service Worker: `app/sw.ts` → `app/serwist/[path]/route.ts` → `components/pwa/SerwistRegister.tsx`
- See `docs/GUIDES/PWA-GUIDE.md` for full instructions

## Plan Review

After creating an implementation plan, run parallel subagent reviews with **architect**, **planner**, and conditionally **security-reviewer** (auth/input/API changes) and **database-reviewer** (DB changes). Auto-revise plan if issues found. Skip if the skill already includes its own review phase.

## Gotchas

- `@handle` routing: `/@username` → `/[handle]` via next.config.ts rewrites
- React Compiler enabled (`reactCompiler: true`) — never write `memo`/`useMemo`/`useCallback`
- `output: 'standalone'` for Docker/VPS deployment
- Dev server binds to `0.0.0.0:3000` (WSL2 compatibility)
- Server Actions body size limit: 10MB (`serverActions.bodySizeLimit`)
- Production DB changes: always use migrate (never db:push)
- `revalidatePath` silently fails on typos — always verify path accuracy against actual routes
- Never leave `console.log`/`console.error` in production code (auto-detected by hooks)

## References

@docs/TROUBLESHOOTING.md
@docs/output-conventions.md
