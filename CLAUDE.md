# CLAUDE.md

Next.js 16 App Router + PostgreSQL + Prisma web application.

## Communication

- Respond in Japanese (internal thinking can be in English)

## Quick Commands

```bash
# Initial setup
cp .env.example .env.local  # Edit with your credentials
npm install

# Development
docker compose -f compose.dev.yaml up -d && npm run dev

# Build
npm run build

# Lint & Type check
npm run lint && npx tsc --noEmit

# Database (local)
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate

# Prisma Studio (local)
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:studio
```

## Key Files

- `auth.ts` - NextAuth v5 configuration
- `middleware.ts` - Route protection and @handle rewriting
- `prisma/schema.prisma` - Database schema (source of truth)
- `lib/prisma.ts` - Prisma client singleton
- `app/sw.ts` - Service Worker (Serwist)

## Environment

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `DISCORD_CLIENT_ID/SECRET`, `STORAGE_*` (Cloudflare R2), `NEXT_PUBLIC_STORAGE_URL`, `NEXT_PUBLIC_DOMAIN`
Optional: `TWITCH_*`

## PWA (Progressive Web App) Support

- Use **Serwist** (`@serwist/turbopack`) for Next.js 16 Turbopack PWA integration
- Service Worker: `app/sw.ts` → `app/serwist/[path]/route.ts` → `components/pwa/SerwistRegister.tsx`
- See `docs/GUIDES/PWA-GUIDE.md` for full instructions

## Plan Review

After creating an implementation plan, run parallel subagent reviews:

- **architect**: Architectural issues, scalability, and design trade-offs
- **planner**: Task breakdown validity, dependency order, and missing steps
- **security-reviewer**: Security gaps (only when the plan involves auth, user input, or API changes)
- **database-reviewer**: Schema/query concerns (only when the plan involves DB changes)

If reviewers find issues, automatically revise the plan before presenting to user.

> **Note**: If a skill (e.g., `nextjs-refactor-planner`) includes its own Plan Review phase, that fulfills this requirement. Do NOT run a duplicate review.

## Gotchas

- `@handle` routing: `/@username` → `/[handle]` via next.config.ts rewrites
- React Compiler enabled (`reactCompiler: true`) - no need for manual `useMemo`/`useCallback`
- `output: 'standalone'` for Docker/VPS deployment
- Dev server binds to `0.0.0.0:3000` (WSL2 対応)
- Server Actions body size limit: 10MB (`serverActions.bodySizeLimit`)
- Production DB changes: always use migrate (never db:push)

## References

@docs/core-rules.md
@docs/TROUBLESHOOTING.md
