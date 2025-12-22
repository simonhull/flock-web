# Flock Web — Patterns Guide

This document covers the key patterns and conventions used in this codebase. Read this before contributing.

---

## Remote Functions

We use SvelteKit's **experimental remote functions** instead of traditional form actions and +page.server.ts files. This keeps server logic colocated and provides type-safe client-server communication.

### File Convention

Remote functions live in `*.remote.ts` files:

```
src/lib/auth.remote.ts      # Auth-related (login, register, logout)
src/routes/blog/data.remote.ts  # Route-specific data
```

### Three Primitives

```typescript
import { query, form, command } from '$app/server'

// query — Read data (GET-like, cacheable)
export const getUser = query(async () => {
  return authService.getSession(event.request.headers)
})

// form — Handle form submissions with validation
export const login = form(LoginSchema, async (data, issue) => {
  const result = await authService.signIn(data.email, data._password)
  if (!result.success) {
    invalid(issue.email(result.message))  // Field-specific error
  }
  redirect(303, '/dashboard')
})

// command — Mutations without form data
export const logout = command(async () => {
  await authService.signOut(event.request.headers)
})
```

### Using Forms in Components

```svelte
<script>
  import { login } from '$lib/auth.remote'
</script>

<!-- Spread form attributes -->
<form {...login} class="space-y-4">
  <!-- Use field.as() for input binding -->
  <input {...login.fields.email.as('email')} />
  <input {...login.fields._password.as('password')} />

  <!-- Pending state for loading indicators -->
  <button disabled={!!login.pending}>
    {login.pending ? 'Signing in...' : 'Sign in'}
  </button>
</form>
```

### Validation Errors

Errors surface via `field.issues()`:

```svelte
{#each login.fields.email.issues() ?? [] as issue}
  <p class="text-destructive">{issue.message}</p>
{/each}
```

### Naming Conventions

- Prefix sensitive fields with `_` (e.g., `_password`, `_confirmPassword`) — these are excluded from URL serialization
- Use Valibot schemas that match the action name: `LoginSchema`, `RegisterSchema`

---

## Async Context Pattern

Svelte's `setContext` must be called during component initialization, but we often need to set context with data fetched asynchronously. Here's how we handle it:

### The Problem

```svelte
<!-- ❌ WRONG — Context set after await, children may access before it's ready -->
<svelte:boundary>
  {@const user = await getUser()}
  {setUserContext(user)}  <!-- Too late! -->
  {@render children()}
</svelte:boundary>

<!-- ❌ ALSO WRONG — Mutating $state during render causes state_unsafe_mutation -->
<script>
  let user = $state<User | null>(null)
  setUserContext(() => user)
</script>
<svelte:boundary>
  {void (user = await getUser())}  <!-- state_unsafe_mutation error! -->
  {@render children()}
</svelte:boundary>
```

### The Solution — Box Pattern

Use a plain object ("box") to hold the async value. Plain object mutation doesn't trigger Svelte's reactive error during render.

**In `src/lib/stores/user.svelte.ts`:**

```typescript
import { getContext, setContext } from 'svelte'

const USER_CONTEXT_KEY = Symbol('user-context')

// Store a GETTER function that returns the current value
export function setUserContext(getter: () => User | null): void {
  setContext(USER_CONTEXT_KEY, getter)
}

// Call the getter to get current value
export function getUserContext(): User | null {
  const getter = getContext<() => User | null>(USER_CONTEXT_KEY)
  return getter()
}
```

**In the layout:**

```svelte
<script lang="ts">
  import { getUser } from '$lib/auth.remote'
  import { setUserContext, type User } from '$lib/stores/user.svelte'

  const { children } = $props()

  // Start fetching immediately
  const userPromise = getUser()

  // Use a plain object (box) — not $state — to avoid state_unsafe_mutation
  const userBox: { current: User | null } = { current: null }
  setUserContext(() => userBox.current)
</script>

<svelte:boundary>
  {#snippet pending()}
    <LoadingSpinner />
  {/snippet}

  {#snippet failed(error)}
    <ErrorMessage />
  {/snippet}

  <!-- Await and update the box (plain object, not reactive state) -->
  {@const user = await userPromise}
  {void (userBox.current = user)}
  {@render children()}
</svelte:boundary>
```

**In child components:**

```svelte
<script>
  // Returns current value via the getter
  const user = getUserContext()
</script>

<p>Welcome, {user?.name}</p>
```

### Why This Works

1. Context is set during initialization (before any child renders)
2. The getter captures the `userBox` reference
3. We use a plain object instead of `$state` to avoid `state_unsafe_mutation`
4. After the await, we mutate `userBox.current` — this is allowed since it's not reactive
5. When children call `getUserContext()`, they get the updated value

---

## Attachments

Attachments replace the legacy `use:` directive for DOM behaviors. They're functions that receive an element and optionally return a cleanup function.

### Location

All reusable attachments live in `src/lib/attachments/index.ts`.

### Creating Attachments

```typescript
import type { Attachment } from 'svelte/attachments'

// Simple — no cleanup needed
export const autofocus: Attachment<HTMLElement> = (element) => {
  element.focus()
}

// With cleanup
export function clickOutside(handler: () => void): Attachment<HTMLElement> {
  return (element) => {
    function onClick(event: MouseEvent) {
      if (!element.contains(event.target as Node)) {
        handler()
      }
    }
    document.addEventListener('click', onClick, true)

    return () => {
      document.removeEventListener('click', onClick, true)
    }
  }
}
```

### Using Attachments

```svelte
<script>
  import { autofocus, clickOutside } from '$lib/attachments'

  let isOpen = $state(false)
</script>

<!-- Static attachment -->
<input {@attach autofocus} />

<!-- Attachment with parameters -->
<div {@attach clickOutside(() => isOpen = false)}>
  ...
</div>
```

---

## Error Boundaries

Use `<svelte:boundary>` for error handling in async components.

### Pattern

```svelte
<svelte:boundary>
  {#snippet pending()}
    <LoadingSpinner />
  {/snippet}

  {#snippet failed(error)}
    <ErrorMessage message="Something went wrong" />
  {/snippet}

  <!-- Async content -->
  {@const data = await fetchData()}
  <Content {data} />
</svelte:boundary>
```

### When to Use

- Around any component that uses `await` in the template
- At route layout level for page-wide error handling
- Around third-party components that might throw

---

## Component Conventions

### Props Pattern

```svelte
<script lang="ts">
  interface Props {
    variant?: 'default' | 'destructive'
    disabled?: boolean
    children?: Snippet
    class?: string  // Always allow class override
  }

  let {
    variant = 'default',
    disabled = false,
    children,
    class: className,
    ...restProps  // Forward remaining props
  }: Props = $props()
</script>

<button class={cn(baseStyles, className)} {disabled} {...restProps}>
  {@render children?.()}
</button>
```

### Snippets over Slots

```svelte
<!-- ✅ Modern — Snippets -->
<Card>
  {#snippet header()}
    <h2>Title</h2>
  {/snippet}

  <p>Content</p>
</Card>

<!-- ❌ Legacy — Slots -->
<Card>
  <h2 slot="header">Title</h2>
  <p>Content</p>
</Card>
```

### Derived State

Use `$derived()` for computed values:

```svelte
<script>
  let { items } = $props()

  // ✅ Reactive computed value
  const total = $derived(items.reduce((sum, i) => sum + i.price, 0))
  const isEmpty = $derived(items.length === 0)
</script>
```

---

## State Management

### When to Use What

| Need | Solution |
|------|----------|
| Component-local state | `$state()` |
| Computed values | `$derived()` |
| State shared in component tree | Context (getter pattern) |
| Global singleton state | Module-level `$state` in `.svelte.ts` |
| Server data | Remote functions (`query`) |

### Avoid

- Stores (`writable`, `readable`) — use runes instead
- `$:` reactive statements — use `$derived()` or `$effect()`
- `export let` — use `$props()`

---

## File Naming

```
src/lib/
├── auth.remote.ts          # Remote functions
├── stores/
│   └── user.svelte.ts      # Reactive module (.svelte.ts for runes)
├── attachments/
│   └── index.ts            # Regular TS (no runes needed)
├── components/
│   └── ui/
│       └── button/
│           ├── button.svelte
│           └── index.ts    # Re-exports
```

---

## Testing

### Unit Tests

```typescript
// *.spec.ts or *.test.ts
import { describe, it, expect } from 'vitest'

describe('safeRedirect', () => {
  it('blocks protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBe('/dashboard')
  })
})
```

### Component Tests

```typescript
// *.svelte.test.ts
import { render, screen } from '@testing-library/svelte'
import Button from './button.svelte'

it('renders children', () => {
  render(Button, { props: { children: () => 'Click me' } })
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### E2E Tests

```typescript
// e2e/*.spec.ts
import { test, expect } from '@playwright/test'

test('login redirects to dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('password')

  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
