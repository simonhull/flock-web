# Flock Web

> SvelteKit application serving web interface and mobile API.

---

## Philosophy

Code is poetry. Every function should have one obvious purpose. Every type should tell a story. Every abstraction should feel inevitable.

**Before writing code, ask:**
- What is the simplest solution that could work?
- What would make this code self-documenting?
- What would a maintainer thank me for?

---

## Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Language | TypeScript 5.9+ | `import defer`, strict inference, native Go port coming |
| Framework | SvelteKit 2.x + Svelte 5 | Runes, fine-grained reactivity, compiled performance |
| Runtime | Cloudflare Workers | Edge-first, globally distributed |
| Database | D1 (SQLite) | Per-church isolation, SQL we understand |
| ORM | Drizzle | Type-safe, no magic, SQL-like |
| Validation | Valibot | Smaller than Zod, composable schemas |
| Auth | BetterAuth | Modern, extensible, session-based |
| UI | shadcn-svelte | Accessible primitives, copy-paste ownership |
| Styling | Tailwind 4.x | Utility-first, design tokens |
| Testing | Vitest + Playwright | Fast unit tests, real E2E |

---

## Svelte 5 — The Only Way

```svelte
<!-- Runes, always -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<button onclick={() => count++}>{doubled}</button>
```

| Rune | Purpose |
|------|---------|
| `$state()` | Reactive state |
| `$state.eager()` | Immediate UI updates (loading states) |
| `$derived()` | Computed values |
| `$effect()` | Side effects (use sparingly) |
| `$props()` | Component props |
| `$bindable()` | Two-way binding props |

### Effect with Cancellation
```typescript
import { getAbortSignal } from 'svelte';

$effect(() => {
  const signal = getAbortSignal();  // Auto-cancels on re-run
  fetch('/api/data', { signal })
    .then(res => res.json())
    .then(data => { /* ... */ });
});
```

**Never use:** `export let`, `$:`, `$$props`, `$$restProps`, `on:event`, `use:action`

### Typed Contexts (Preferred for Shared State)
```typescript
// src/lib/stores/user.svelte.ts
import { createContext } from 'svelte';

// Returns [get, set] tuple — type-safe, no manual casting
export const [getUserContext, setUserContext] = createContext<User | null>();

// In parent (e.g., layout):
setUserContext(user);

// In child components:
const user = getUserContext();
```

### Attachments (Replace Actions)
```svelte
<!-- ✅ Modern: Attachments -->
<input {@attach autofocus} />
<div {@attach clickOutside(() => isOpen = false)}>...</div>

<!-- ❌ Legacy: Actions (use fromAction to migrate) -->
<input use:autofocus />
```

See `$lib/attachments/` for reusable attachments: `autofocus`, `clickOutside`, `trapFocus`.

### Eager State (Immediate UI Updates)
```svelte
<script>
  let loading = $state(false);
</script>

<!-- $state.eager() updates UI immediately during async operations -->
<button disabled={$state.eager(loading)}>
  {$state.eager(loading) ? 'Saving...' : 'Save'}
</button>
```

---

## Architecture

```
src/
├── lib/
│   ├── server/           # NEVER imports into client
│   │   ├── db/           # Drizzle schemas + clients
│   │   ├── services/     # Business logic lives HERE
│   │   ├── permissions/  # Authorization engine
│   │   └── auth/         # BetterAuth config
│   ├── attachments/      # Reusable attachments (autofocus, clickOutside, etc.)
│   ├── components/       # UI components
│   ├── stores/           # Typed contexts (.svelte.ts)
│   ├── types/            # Domain types
│   └── utils/            # Validation schemas, helpers
├── routes/
│   ├── (marketing)/      # Public pages
│   ├── (auth)/           # Login, register
│   ├── (app)/            # Authenticated app (user context set in layout)
│   └── api/v1/           # Mobile REST API
└── hooks.server.ts       # Auth middleware
```

### The Golden Rule
**Services contain all business logic. Routes are thin adapters.**

Routes do three things:
1. Authenticate/authorize
2. Validate input (Valibot)
3. Call service, return response

---

## TypeScript 5.9 — Modern Patterns

### Deferred Imports (Lazy Loading)
```typescript
// ✅ Defer heavy modules until actually needed
import defer * as pdfGenerator from '$lib/server/pdf';

// Module only loads when property accessed
const pdf = await pdfGenerator.create(data);
```

### Strict Configuration
```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // Arrays may be undefined
    "exactOptionalPropertyTypes": true, // undefined ≠ missing
    "noPropertyAccessFromIndexSignature": true,
    "module": "node20"  // Stable Node.js 20 module resolution
  }
}
```

---

## Type System

Types are documentation. Make illegal states unrepresentable.

```typescript
// ✅ Discriminated unions over optional fields
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

// ✅ Branded types for IDs
type UserId = string & { readonly __brand: 'UserId' };
type ChurchId = string & { readonly __brand: 'ChurchId' };

// ✅ Const assertions for exhaustive handling
const ConnectionStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DECLINED: 'declined',
} as const;
type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];

// ✅ Satisfies for type checking without widening
const config = {
  apiUrl: '/api/v1',
  timeout: 5000,
} satisfies Config;
```

**Never use:** `any`, `unknown` without narrowing, `as` casts (except branded types), `@ts-ignore`

---

## Validation (Valibot)

Validate at system boundaries. Trust data inside.

```typescript
// src/lib/utils/validation.ts
import * as v from 'valibot';

// Composable primitives
export const Id = v.pipe(v.string(), v.regex(/^[a-z]{3}_[a-z0-9]{12}$/));
export const Email = v.pipe(v.string(), v.trim(), v.email(), v.maxLength(255));
export const NonEmpty = (max: number) => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

// Domain schemas
export const CreateChurch = v.object({
  name: NonEmpty(100),
  description: v.optional(NonEmpty(500)),
});
```

**Pattern:** Schema name matches action — `CreateChurch`, `UpdateEvent`, `ConnectRequest`

---

## Error Handling

Errors are first-class citizens. Handle them with intention.

```typescript
// Typed errors with codes
class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number = 400
  ) {
    super(message);
  }
}

// Service layer throws typed errors
throw new AppError('Church not found', 'CHURCH_NOT_FOUND', 404);

// Route layer catches and formats
try {
  const result = await service.action(input);
  return json({ data: result });
} catch (e) {
  if (e instanceof AppError) {
    return json({ error: e.message, code: e.code }, { status: e.status });
  }
  throw e; // Let SvelteKit handle unexpected errors
}
```

---

## Security — Non-Negotiables

| Rule | Implementation |
|------|----------------|
| Auth on every protected route | `hooks.server.ts` middleware |
| Validate all input | Valibot at route entry |
| Parameterized queries only | Drizzle handles this |
| No secrets in client | `$lib/server/` boundary |
| CSRF protection | BetterAuth handles this |
| Rate limiting | Cloudflare + custom middleware |
| No PII in logs | Structured logging, redacted |

```typescript
// hooks.server.ts — Protect (app) routes
export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.user = session?.user ?? null;

  if (event.url.pathname.startsWith('/app') && !event.locals.user) {
    redirect(303, '/login');
  }
  return resolve(event);
};
```

---

## Database (Drizzle + D1)

```typescript
// Schema as source of truth
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Type-safe queries
const user = await db.select().from(users).where(eq(users.id, id)).get();

// Transactions for multi-step operations
await db.transaction(async (tx) => {
  await tx.insert(churches).values(church);
  await tx.insert(connections).values(connection);
});
```

**Multi-tenant pattern:** Global D1 for users/churches. Per-church D1 for isolated data.

---

## API Design (for Mobile)

```typescript
// Consistent response shapes
{ data: T }                           // Success
{ data: T[], meta: { total, page, hasMore } }  // Paginated
{ error: string, code: string }       // Error

// RESTful, predictable
GET    /api/v1/churches              // List
POST   /api/v1/churches              // Create
GET    /api/v1/churches/:id          // Read
PATCH  /api/v1/churches/:id          // Update
DELETE /api/v1/churches/:id          // Delete
POST   /api/v1/churches/:id/connect  // Action
```

---

## Testing

### Hierarchy
1. **Unit tests** — Services, validation, utilities (fast, isolated)
2. **Integration tests** — API routes with mocked DB
3. **E2E tests** — Critical user journeys (Playwright)

### Philosophy
- Test behavior, not implementation
- One assertion per test when possible
- Tests are documentation — name them as sentences

### Edge Cases — Always Cover
- Empty/null/whitespace inputs
- Boundary values (min, max, off-by-one)
- Unauthorized access attempts
- Concurrent modifications
- Malformed payloads
- Unicode and special characters

---

## Performance

- **Preload data** in `+layout.server.ts` for nested routes
- **Stream** large responses with SvelteKit's streaming
- **Cache** at the edge with Cloudflare Cache API
- **Defer** non-critical data with `$effect` after mount
- **Measure** with Cloudflare Analytics, not intuition

---

## UI Components

### Philosophy: Primitives First

Build a library of small, composable, reusable components. Every component should do one thing well. Compose complexity from simplicity.

### shadcn-svelte — The Foundation

[shadcn-svelte](https://shadcn-svelte.com) is our starting point for UI primitives. Not a dependency — you own the code.

```bash
# Add components as needed
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add form
```

**Why shadcn:**
- Built on Bits UI (headless, accessible primitives)
- Copy-paste into `$lib/components/ui/` — you own it
- Tailwind styling you can customize
- Keyboard navigation and ARIA built-in

### Component Organization

```
src/lib/components/
├── ui/                    # shadcn primitives (Button, Input, Dialog...)
│   ├── button/
│   │   ├── index.ts
│   │   └── button.svelte
│   └── ...
├── patterns/              # Composed patterns (SearchInput, UserMenu...)
└── features/              # Feature-specific (ChurchCard, EventList...)
```

### Component Principles

1. **Primitives are sacred** — Don't modify `ui/` components heavily; compose around them
2. **Props over slots** when data is simple; **slots** when content is complex
3. **Forward all attributes** — Use `{...restProps}` for flexibility
4. **Types are documentation** — Export prop types for consumers

```svelte
<!-- ✅ Good: Composable, typed, accessible -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  interface Props {
    loading?: boolean;
    children: Snippet;
  }
  let { loading = false, children }: Props = $props();
</script>

<Button disabled={loading} aria-busy={loading}>
  {#if loading}
    <Spinner class="mr-2" />
  {/if}
  {@render children()}
</Button>
```

---

## Accessibility — Non-Negotiable

Accessibility is not a feature. It's a requirement. Every component, every interaction.

### Keyboard Navigation is Paramount

If you can't use it with a keyboard, it's broken.

| Pattern | Keys | Behavior |
|---------|------|----------|
| Buttons | `Enter`, `Space` | Activate |
| Dialogs | `Escape` | Close |
| Menus | `Arrow keys` | Navigate items |
| Forms | `Tab` | Move between fields |
| Lists | `Arrow keys`, `Home`, `End` | Navigate |

### The Rules

1. **Semantic HTML first** — `<button>` not `<div onclick>`
2. **Visible focus states** — Never remove `:focus-visible` outlines
3. **ARIA only when needed** — HTML semantics first, ARIA to enhance
4. **Color is not enough** — Icons, text, patterns for meaning
5. **Announce changes** — Use live regions for dynamic content
6. **Test with keyboard** — Tab through every flow before shipping
7. **Focus management** — Return focus after dialogs close, manage on route changes

### Testing Accessibility

```bash
# Lighthouse in CI
pnpm test:a11y

# Manual testing checklist
# ✓ Tab through entire page
# ✓ Use screen reader (VoiceOver, NVDA)
# ✓ Zoom to 200%
# ✓ High contrast mode
# ✓ Reduce motion preference
```

**WCAG AA minimum.** AAA where practical.

---

## Commands

```bash
# Development
pnpm dev                    # Dev server
pnpm dev:wrangler           # With Cloudflare bindings

# Quality
pnpm check                  # Svelte + TypeScript
pnpm lint && pnpm format    # ESLint + Prettier

# Testing
pnpm test                   # Unit tests
pnpm test:e2e               # Playwright

# Database
pnpm db:generate            # Generate migrations
pnpm db:migrate:local       # Apply to local D1

# Deploy
pnpm build && pnpm deploy   # Ship it
```

---

## Principles

1. **Types are documentation** — If it compiles, it should work
2. **Services own logic** — Routes are adapters, nothing more
3. **Validate at boundaries** — Trust nothing from outside
4. **Errors are explicit** — Typed, coded, handleable
5. **Security by default** — Auth, validation, parameterized queries
6. **Test behavior** — What it does, not how it does it
7. **Accessibility always** — Keyboard first, semantic HTML, ARIA when needed
8. **Primitives compose** — Small reusable components, shadcn-svelte foundation
9. **Simplify ruthlessly** — The best code is code you don't write
