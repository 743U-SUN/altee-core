# CLAUDE.md

Next.js 16 App Router + PostgreSQL + Prisma web application.

## Communication

- Respond in Japanese (internal thinking can be in English)

## Quick Commands

```bash
# Development
docker compose -f compose.dev.yaml up -d && npm run dev

# Lint & Type check
npm run lint && npx tsc --noEmit

# Database (local)
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate
```

## Core Rules

- Server Components first, Client Components only when needed
- Server Actions first (API Routes only for webhooks/external APIs)
- TypeScript/ESLint errors must always be zero
- Use shadcn/ui + lucide-react (don't reinvent UI)
- No global state libraries (use nuqs for URL state when needed)
- Production DB changes: always use migrate (never db:push)

## PWA (Progressive Web App) Support
- Use **Serwist** (`@serwist/turbopack`) for Next.js 16 Turbopack PWA integration.
- Service Worker logic lives in `app/sw.ts`.
- Route handler at `app/serwist/[path]/route.ts` generates `sw.js`.
- Registration via `components/pwa/SerwistRegister.tsx` using `@serwist/window`.
- See `docs/GUIDES/PWA-GUIDE.md` for full instructions.

## Architecture

- `app/` - Routes and pages (App Router)
- `components/` - Reusable UI (no business logic)
- `lib/` - Utility functions
- `services/` - Business logic and external APIs
- Feature-specific components: same level as page.tsx

## Data Patterns

| Scenario | Implementation |
|----------|----------------|
| Non-interactive | Server Components + Server Actions |
| Interactive | Client Components + Server Actions + useSWR |

## Security (3-Layer Auth)

1. **Middleware**: Route-level auth check
2. **Layout**: State verification and redirects
3. **Page/Actions**: Final permission check

## Plan Review

After creating an implementation plan, run parallel subagent reviews:

- **architect**: Architectural issues, scalability, and design trade-offs
- **planner**: Task breakdown validity, dependency order, and missing steps
- **security-reviewer**: Security gaps (only when the plan involves auth, user input, or API changes)
- **database-reviewer**: Schema/query concerns (only when the plan involves DB changes)

If reviewers find issues, automatically revise the plan before presenting to user.

> **Note**: If a skill (e.g., `nextjs-refactor-planner`) includes its own Plan Review phase, that fulfills this requirement. Do NOT run a duplicate review.

## References

@docs/core-rules.md
