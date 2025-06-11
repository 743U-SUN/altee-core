# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development (Local):**
```bash
docker compose -f compose.dev.yaml up -d  # Start development environment
npm run dev                                # Start development server with Turbopack
npm run build                              # Build for production
npm run lint                               # Run ESLint checks
docker compose -f compose.dev.yaml down   # Stop development environment
```

**Database (Prisma):**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:push        # Push schema changes to database
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate     # Create and run migrations
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:studio:local # Open Prisma Studio (local)
docker compose -f compose.dev.yaml exec app npm run db:studio                                                # Open Prisma Studio (Docker)
npm run db:generate                           # Generate Prisma Client
```

**Production (VPS):**
```bash
docker compose -f compose.prod.yaml up -d    # Start production environment
docker compose -f compose.prod.yaml down     # Stop production environment
docker compose -f compose.prod.yaml restart  # Restart production environment
docker compose -f compose.prod.yaml logs -f  # View logs
```

**Production Database Management:**
```bash
./scripts/migrate-production.sh              # Run production migrations with backup
./scripts/backup-database.sh [description]   # Create database backup
```

**Production Prisma Studio (SSH Access):**
```bash
ssh sakura-vps                               # Connect to VPS
docker compose -f compose.prod.yaml exec app npx prisma studio  # Start Prisma Studio
# Access via browser: http://localhost:5555 (while SSH connected)
```

## Architecture Overview

This is a Next.js 15.3.3 application using the App Router paradigm with the following key architectural decisions:

1. **Server-First Approach**: Default to Server Components. Use Client Components only when interactivity is required.

2. **Server Actions**: Primary method for server-side processing and mutations. API Routes should only be used when absolutely necessary (e.g., webhooks, external API integrations).

3. **Type Safety**: TypeScript is mandatory. All code must pass TypeScript checks with zero errors. ESLint must also report zero errors.

4. **Component Architecture**:
   - `app/` - Routes and pages following Next.js App Router conventions
   - `components/` - Pure UI components without business logic
   - `lib/` - Utility functions and helpers
   - `services/` - Business logic and external API integrations
   - All shadcn/ui components are pre-installed in `components/ui/`

5. **State Management**:
   - URL state using `nuqs` for shareable application state
   - React Hook Form + Zod for form state and validation
   - No global state management libraries

6. **Data Fetching Patterns**:
   - Server Components for non-interactive data display
   - Client Components + Server Actions + useSWR for interactive data needs
   - Direct database queries in Server Components/Actions (when Prisma is configured)

## Important Development Guidelines

1. **YAGNI Principle**: Build only what is immediately needed. Avoid premature abstractions.

2. **Component Usage**: Always use existing shadcn/ui components from `components/ui/` before creating custom components.

3. **Icons**: Use lucide-react for all icons.

4. **Forms**: Implement forms using react-hook-form with Zod schemas for validation.

5. **Styling**: Use Tailwind CSS classes. The project uses Tailwind v4 with PostCSS.

6. **Authentication**: When implementing auth, follow the 3-layer pattern:
   - Middleware (route protection)
   - Layout (UI adaptation)
   - Page/Actions (data access control)

## Core Development Rules

### Technology Stack
- Next.js: ^15
- React: ^19
- PostgreSQL: ^17.4
- Prisma ORM: ^6.7
- TypeScript: ^5
- Docker

### Core Principles
1. **App Router** as standard
2. **TypeScript mandatory** - ESLint/type errors must always be zero
3. **Server Actions first** - Use Server Actions for server processing. API Routes only when absolutely necessary (external APIs, webhooks)
4. **YAGNI** (You Aren't Gonna Need It) - Don't build until needed
5. **KISS** (Keep It Simple, Stupid) - Simplicity beats complexity

### Directory Layout
```
app/         # Routing & pages
components/  # Reusable UI (no business logic)
lib/         # Utility functions
hooks/       # Custom hooks
types/       # Type definitions
constants/   # Constants
config/      # Config values & environment variable wrappers
services/    # External API wrappers & business logic
demo/        # Manual test pages accessible from frontend
```

- **Feature-specific components**: Same level as corresponding page.tsx
- **Reusable components**: Place in components/

### Data Handling Patterns

| Dependency | Implementation |
|------------|----------------|
| Not dependent on user interaction | Server Components + Server Actions |
| Dependent on user interaction | Client Components + Server Actions + useSWR |

- Updates via Server Actions
- Immediate reflection via useSWR.mutate for optimistic updates

### UI Guidelines
- **Always use shadcn/ui components** - Don't reinvent the wheel
- **Icons**: Use lucide-react exclusively
- **State Management**:
  - URL state: Use nuqs
  - No global state libraries (except NextAuth SessionProvider)
  - Data state managed as Server State

### Performance Optimization
- Minimize `use client`, `useEffect`, `useState` - RSC first
- Client-side: Use Suspense with fallbacks
- Dynamic imports for lazy loading
- Images: next/image, Links: next/link
- Strict route-based code splitting

### Forms and Validation
- Controlled components + react-hook-form
- Schema validation with Zod
- Validate on both client and server

### Quality, Security & Testing

#### Error Handling
- Guard clauses with early returns
- Success path at the end

#### Accessibility
- Semantic HTML + ARIA
- Keyboard navigation support

#### Authentication/Authorization 3-Layer Architecture
1. **Middleware**: Route-level authentication checks (e.g., /user/* → auth required)
2. **Layout**: Detailed state verification and redirects (onboarding completion, account validity)
3. **Page/Server Actions**: Final permission checks with principle of least privilege
- Implementation: Guard clauses at each layer, assume authenticated for subsequent processing
- See docs/security-guide.md for detailed implementation

#### Testing
- Place UI-based test pages in demo/ directory
- Enable manual browser-based verification of all Server Actions and client functions

### Image Management
- File storage: Sakura Internet Object Storage (S3-compatible, MinIO in development)
- Unified system for image optimization, security, and upload processing
- See docs/image-handling-guide.md and docs/image-upload-guide.md for details

### Implementation Flow
1. **Design**: Determine core principles and directory structure
2. **Data**: Establish fetch (useSWR) and update (Server Actions + mutate) rules
3. **UI/State**: Use shadcn/ui and lucide-react, URL state with nuqs
4. **Performance**: Optimize with RSC, Suspense, dynamic imports
5. **Forms & Validation**: Zod × react-hook-form
6. **Quality Control**: Error handling → Accessibility → Dedicated Server Actions → Manual testing in demo/

## File Encoding Guidelines

**IMPORTANT**: Always use UTF-8 encoding when creating or editing files containing Japanese text.

- **Markdown files**: Use UTF-8 encoding to prevent character corruption
- **Source code files**: UTF-8 encoding is mandatory for Japanese comments/strings
- **Configuration files**: Ensure UTF-8 encoding for any Japanese content

**Common Issues**:
- Japanese characters appearing as garbled text (文字化け)
- Encoding mismatch between editor and file system
- Invalid byte sequences in UTF-8 files

**Solution**: When text appears corrupted, recreate the file with proper UTF-8 encoding.