# Flock Web

> SvelteKit application serving both the web interface and mobile API.

---

## Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | SvelteKit | 2.x (Svelte 5) |
| Runtime | Cloudflare Workers | - |
| Database | Cloudflare D1 (SQLite) | - |
| ORM | Drizzle | Latest |
| Validation | Valibot | Latest |
| Auth | BetterAuth | Latest |
| Styling | Tailwind CSS | 4.x |
| Testing | Vitest + Playwright | Latest |

**Always use the latest stable versions.** Check for updates regularly.

---

## Svelte 5 Conventions

We use Svelte 5 with runes. This is non-negotiable.

```svelte
<script>
  // ✅ Svelte 5 runes
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  function increment() {
    count++;
  }
</script>

<!-- ✅ Modern event handling -->
<button onclick={increment}>
  {count} × 2 = {doubled}
</button>
```

```svelte
<script>
  // ❌ Svelte 4 patterns - DO NOT USE
  export let count = 0;
  $: doubled = count * 2;
</script>
```

### State Management

- **Component state**: `$state()` rune
- **Derived values**: `$derived()` rune
- **Side effects**: `$effect()` rune
- **Shared state**: Stores in `$lib/stores/` using `$state()` in `.svelte.ts` files

```typescript
// src/lib/stores/user.svelte.ts
import type { User } from '$lib/types';

let user = $state<User | null>(null);

export function getUser() {
  return user;
}

export function setUser(newUser: User | null) {
  user = newUser;
}
```

---

## Project Structure

```
src/
├── lib/
│   ├── server/                 # Server-only (never in browser bundle)
│   │   ├── db/
│   │   │   ├── global/         # Global D1 schema + client
│   │   │   │   ├── schema.ts
│   │   │   │   └── client.ts
│   │   │   ├── church/         # Per-church D1 schema + client
│   │   │   │   ├── schema.ts
│   │   │   │   └── client.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── services/           # Business logic - THE HEART
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.test.ts
│   │   │   ├── church.service.ts
│   │   │   ├── church.service.test.ts
│   │   │   └── ...
│   │   │
│   │   ├── permissions/        # Authorization engine
│   │   │   ├── engine.ts
│   │   │   ├── engine.test.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── auth/               # BetterAuth configuration
│   │       └── index.ts
│   │
│   ├── components/             # Svelte components
│   │   ├── ui/                 # Primitives (Button, Input, Card, etc.)
│   │   ├── forms/              # Form components
│   │   ├── feed/               # Feed-related components
│   │   ├── church/             # Church-related components
│   │   └── ...
│   │
│   ├── stores/                 # Svelte stores (.svelte.ts files)
│   │   ├── user.svelte.ts
│   │   └── ...
│   │
│   ├── types/                  # TypeScript types
│   │   ├── domain.ts           # Domain entities
│   │   ├── api.ts              # API request/response types
│   │   └── index.ts
│   │
│   └── utils/                  # Shared utilities
│       ├── validation.ts       # Valibot schemas
│       ├── validation.test.ts
│       ├── id.ts               # ID generation
│       └── ...
│
├── routes/
│   ├── (marketing)/            # Public pages (landing, pricing)
│   │   ├── +page.svelte
│   │   └── ...
│   │
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   ├── register/
│   │   └── +layout.svelte
│   │
│   ├── (app)/                  # Authenticated application
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts   # Auth guard, load user
│   │   ├── dashboard/
│   │   ├── churches/
│   │   │   ├── +page.svelte    # My churches
│   │   │   ├── discover/       # Find churches
│   │   │   └── [slug]/         # Church context
│   │   │       ├── +layout.svelte
│   │   │       ├── +page.svelte
│   │   │       ├── groups/
│   │   │       ├── events/
│   │   │       └── settings/
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── api/                    # REST API for mobile
│   │   └── v1/
│   │       ├── auth/
│   │       ├── profile/
│   │       ├── churches/
│   │       └── ...
│   │
│   ├── +layout.svelte
│   └── +error.svelte
│
├── hooks.server.ts             # Server hooks (auth middleware)
├── hooks.client.ts             # Client hooks (error handling)
├── app.html
├── app.css                     # Tailwind imports
└── app.d.ts                    # Type declarations
```

---

## The Service Layer Pattern

All business logic lives in services. Routes are thin adapters.

```typescript
// src/lib/server/services/church.service.ts

import { globalDb } from '$lib/server/db/global';
import { churches, connections } from '$lib/server/db/global/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { CreateChurchSchema } from '$lib/utils/validation';
import { generateId } from '$lib/utils/id';
import type { User } from '$lib/types';

export class ChurchService {
  async create(input: v.InferInput<typeof CreateChurchSchema>, user: User) {
    const validated = v.parse(CreateChurchSchema, input);
    
    const church = await globalDb
      .insert(churches)
      .values({
        id: generateId('church'),
        name: validated.name,
        slug: this.generateSlug(validated.name),
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then(rows => rows[0]);

    // Auto-connect creator
    await globalDb.insert(connections).values({
      id: generateId('connection'),
      userId: user.id,
      churchId: church.id,
      status: 'active',
      requestedAt: new Date(),
      connectedAt: new Date(),
    });

    return church;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

```typescript
// src/routes/(app)/churches/+page.server.ts

import { ChurchService } from '$lib/server/services/church.service';
import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { CreateChurchSchema } from '$lib/utils/validation';

export const actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const input = Object.fromEntries(formData);
    
    const result = v.safeParse(CreateChurchSchema, input);
    if (!result.success) {
      return fail(400, { errors: result.issues });
    }

    const service = new ChurchService();
    const church = await service.create(result.output, locals.user);
    
    return { church };
  }
};
```

---

## Test-Driven Development

**Every feature starts with a test.** This is how we work.

### The TDD Cycle

```
1. RED    → Write a failing test
2. GREEN  → Write minimum code to pass
3. REFACTOR → Improve while staying green
4. EDGE CASES → Add tests for boundaries, errors, edge cases
```

### Test File Naming

Tests live next to their source files:

```
src/lib/server/services/
├── church.service.ts
├── church.service.test.ts    # ← Unit tests
├── auth.service.ts
└── auth.service.test.ts
```

### Unit Test Example

```typescript
// src/lib/server/services/church.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChurchService } from './church.service';

// Mock the database
vi.mock('$lib/server/db/global', () => ({
  globalDb: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'chr_test123456', name: 'Grace Church' }]),
  },
}));

describe('ChurchService', () => {
  let service: ChurchService;
  const mockUser = { id: 'usr_test123456', email: 'test@example.com' };

  beforeEach(() => {
    service = new ChurchService();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a church with valid input', async () => {
      const input = { name: 'Grace Church' };
      
      const church = await service.create(input, mockUser);
      
      expect(church.name).toBe('Grace Church');
      expect(church.id).toMatch(/^chr_/);
    });

    it('should generate a URL-safe slug', async () => {
      const input = { name: 'First Baptist Church of Springfield' };
      
      const church = await service.create(input, mockUser);
      
      expect(church.slug).toBe('first-baptist-church-of-springfield');
    });

    it('should reject names shorter than 2 characters', async () => {
      const input = { name: 'A' };
      
      await expect(service.create(input, mockUser)).rejects.toThrow();
    });

    it('should reject names longer than 100 characters', async () => {
      const input = { name: 'A'.repeat(101) };
      
      await expect(service.create(input, mockUser)).rejects.toThrow();
    });

    it('should auto-connect the creator to the church', async () => {
      const input = { name: 'Grace Church' };
      
      await service.create(input, mockUser);
      
      // Verify connection was created
      expect(globalDb.insert).toHaveBeenCalledTimes(2); // church + connection
    });

    it('should handle special characters in names', async () => {
      const input = { name: "St. Mary's — The Cathedral" };
      
      const church = await service.create(input, mockUser);
      
      expect(church.slug).toBe('st-marys-the-cathedral');
    });

    it('should trim whitespace from names', async () => {
      const input = { name: '  Grace Church  ' };
      
      const church = await service.create(input, mockUser);
      
      expect(church.name).toBe('Grace Church');
    });
  });
});
```

### Edge Cases to Always Consider

```typescript
// ✅ Always test these scenarios:

// Input validation
it('handles empty input');
it('handles null/undefined');
it('handles input at minimum boundary');
it('handles input at maximum boundary');
it('handles input beyond boundaries');
it('handles malformed input');
it('handles special characters');
it('handles unicode');
it('handles whitespace');

// Authorization
it('allows authorized users');
it('denies unauthorized users');
it('handles missing permissions');
it('handles expired permissions');
it('handles permission hierarchy');

// Database operations
it('handles not found');
it('handles duplicate entries');
it('handles concurrent modifications');
it('handles transaction failures');

// State
it('handles initial state');
it('handles state transitions');
it('handles invalid state transitions');

// Error cases
it('returns appropriate error codes');
it('includes helpful error messages');
it('does not leak sensitive information');
```

### Integration Tests

```typescript
// src/routes/api/v1/churches/+server.test.ts

import { describe, it, expect } from 'vitest';
import { createTestApp } from '$lib/test/utils';

describe('POST /api/v1/churches', () => {
  it('creates a church when authenticated', async () => {
    const app = await createTestApp();
    const user = await app.createUser();
    
    const response = await app.request('/api/v1/churches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Grace Church' }),
    });
    
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.name).toBe('Grace Church');
  });

  it('returns 401 when not authenticated', async () => {
    const app = await createTestApp();
    
    const response = await app.request('/api/v1/churches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Grace Church' }),
    });
    
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    const app = await createTestApp();
    const user = await app.createUser();
    
    const response = await app.request('/api/v1/churches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '' }),
    });
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// tests/e2e/church-creation.test.ts

import { test, expect } from '@playwright/test';

test.describe('Church Creation', () => {
  test('user can create a new church', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to create church
    await page.goto('/churches');
    await page.click('text=Create Church');
    
    // Fill form
    await page.fill('[name="name"]', 'Grace Community Church');
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page).toHaveURL(/\/churches\/grace-community-church/);
    await expect(page.locator('h1')).toContainText('Grace Community Church');
  });
});
```

---

## Validation with Valibot

Schemas define the contract. Validate at the boundary.

```typescript
// src/lib/utils/validation.ts

import * as v from 'valibot';

// Reusable schemas
export const IdSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z]{3}_[a-z0-9]{12}$/, 'Invalid ID format')
);

export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.email('Invalid email address'),
  v.maxLength(255, 'Email too long')
);

// Domain schemas
export const CreateChurchSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(100, 'Name must be at most 100 characters')
  ),
  description: v.optional(
    v.pipe(v.string(), v.maxLength(500, 'Description too long'))
  ),
  website: v.optional(
    v.pipe(v.string(), v.url('Invalid URL'))
  ),
});

export const CreateEventSchema = v.pipe(
  v.object({
    title: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(2),
      v.maxLength(200)
    ),
    description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
    startsAt: v.date(),
    endsAt: v.date(),
    location: v.optional(v.pipe(v.string(), v.maxLength(200))),
    capacity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  }),
  v.forward(
    v.check(
      (input) => input.endsAt > input.startsAt,
      'End time must be after start time'
    ),
    ['endsAt']
  )
);
```

```typescript
// src/lib/utils/validation.test.ts

import { describe, it, expect } from 'vitest';
import * as v from 'valibot';
import { CreateChurchSchema, CreateEventSchema } from './validation';

describe('CreateChurchSchema', () => {
  it('accepts valid input', () => {
    const input = { name: 'Grace Church' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name', () => {
    const input = { name: '  Grace Church  ' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.name).toBe('Grace Church');
    }
  });

  it('rejects empty name', () => {
    const input = { name: '' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(false);
  });

  it('rejects name that is too short', () => {
    const input = { name: 'A' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(false);
  });

  it('rejects name that is too long', () => {
    const input = { name: 'A'.repeat(101) };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(false);
  });

  it('accepts optional description', () => {
    const input = { name: 'Grace Church', description: 'A welcoming community' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(true);
  });

  it('rejects invalid website URL', () => {
    const input = { name: 'Grace Church', website: 'not-a-url' };
    const result = v.safeParse(CreateChurchSchema, input);
    expect(result.success).toBe(false);
  });
});

describe('CreateEventSchema', () => {
  it('rejects end time before start time', () => {
    const input = {
      title: 'Sunday Service',
      startsAt: new Date('2024-01-01T10:00:00'),
      endsAt: new Date('2024-01-01T09:00:00'), // Before start
    };
    const result = v.safeParse(CreateEventSchema, input);
    expect(result.success).toBe(false);
  });
});
```

---

## API Routes (for Mobile)

REST endpoints in `/api/v1/` follow consistent patterns.

```typescript
// src/routes/api/v1/churches/+server.ts

import { json } from '@sveltejs/kit';
import { ChurchService } from '$lib/server/services/church.service';
import { CreateChurchSchema } from '$lib/utils/validation';
import * as v from 'valibot';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = new ChurchService();
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20');
  
  const result = await service.listForUser(locals.user.id, { page, pageSize });
  
  return json({
    data: result.churches,
    meta: {
      total: result.total,
      page,
      pageSize,
      hasMore: result.total > page * pageSize,
    },
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const result = v.safeParse(CreateChurchSchema, body);
  
  if (!result.success) {
    return json(
      { error: 'Validation failed', details: result.issues },
      { status: 400 }
    );
  }

  const service = new ChurchService();
  
  try {
    const church = await service.create(result.output, locals.user);
    return json({ data: church }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateError) {
      return json({ error: 'Church name already taken' }, { status: 409 });
    }
    throw error;
  }
};
```

---

## Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm dev:wrangler           # Start with Wrangler (closer to prod)

# Testing
pnpm test                   # Run unit tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run with coverage report
pnpm test:e2e               # Run Playwright E2E tests

# Database
pnpm db:generate            # Generate migrations from schema
pnpm db:migrate             # Run migrations
pnpm db:migrate:local       # Run migrations on local D1
pnpm db:studio              # Open Drizzle Studio

# Quality
pnpm check                  # Svelte-check + TypeScript
pnpm lint                   # ESLint
pnpm format                 # Prettier

# Build & Deploy
pnpm build                  # Build for production
pnpm preview                # Preview production build
pnpm deploy                 # Deploy to Cloudflare
```

---

## Configuration Files

### `vite.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.ts', '**/types/**'],
    },
  },
});
```

### `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
    }),
  },
};
```

---

## Key Reminders

1. **Svelte 5 only** — Use runes, not legacy reactive statements
2. **TDD always** — Write failing test first
3. **Services are the heart** — Routes are thin adapters
4. **Validate at boundary** — Use Valibot schemas, trust data inside
5. **Test edge cases** — Empty, null, boundaries, unicode, errors
6. **Type everything** — No `any`, prefer inference from schemas
