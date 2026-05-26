# Copilot Instructions - Solutif CRM Frontend

## Architecture Overview

This is a **Nuxt 4 + TypeScript** application using a feature-based architecture with automatic case conversion (snake_case backend ↔ camelCase frontend).

### Core Stack

- **Nuxt 4** with Vite, SSR, and typed pages (Vue 3 + `<script setup>`)
- **TanStack Query** (Vue Query) for server state management
- **Pinia** for client state management
- **UnoCSS** (with shadcn-nuxt preset) for atomic CSS styling
- **Zod + vee-validate** for form validation
- **nuxt-auth-utils** + **nuxt-authorization** for authentication/authorization

### Key Architectural Patterns

#### 1. Feature-Based Organization (`app/features/*/`)

Each feature follows a consistent structure:

```
features/users/
  ├── domain.ts          # Types, interfaces, repository contract
  ├── repo.rest.ts       # REST API implementation
  ├── repo.mock.ts       # Mock implementation (optional)
  ├── useUsersQuery.ts   # Vue Query composables (CRUD + URL sync)
  ├── forms/schemas.ts   # Zod validation schemas
  └── components/        # Feature-specific components
```

**Critical**: Always import from `domain.ts` for types, never from implementation files.

#### 2. Repository Pattern with Dynamic Provider Selection

- Repositories are auto-loaded via `app/plugins/repos.ts` using dynamic imports
- Provider selection: `NUXT_PUBLIC_REPO_PROVIDER` (rest/mock/gql) - defaults to `rest`
- Access via `$repos`: `const { $repos } = useNuxtApp(); $repos.users.list()`
- Each feature must export a factory function: `export default (api) => ({ list, get, create, update, delete })`

#### 3. Automatic Case Conversion

- **Backend**: snake_case (e.g., `user_id`, `created_at`)
- **Frontend**: camelCase (e.g., `userId`, `createdAt`)
- Conversion happens automatically in `/server/api/proxy/[...path].ts` (both request/response)
- Manual conversion available via `useCaseConverter()` composable when needed

**Example** (`app/features/users/repo.rest.ts`):

```typescript
// Backend returns: { user_id: "123", email_address: "user@example.com" }
// Mapped to domain: { id: "123", email: "user@example.com" }
function toDomainUser(t: z.infer<typeof zUserTransport>): User {
  return {
    id: t.userId ?? '',
    email: t.emailAddress ?? null,
    // ... manual mapping from flexible backend schema
  }
}
```

#### 4. BFF Pattern (Backend-for-Frontend)

- All API calls go through `/server/api/proxy/[...path].ts`
- Proxy injects: `Authorization: Bearer {token}`, `X-Tenant-ID` header
- Token retrieved from `nuxt-auth-utils` session (never exposed to client)
- Multi-tenant support via `useTenantId()` composable

## Development Workflows

### Adding a New Feature

1. Create `app/features/{name}/domain.ts` with types + repository interface
2. Create `app/features/{name}/repo.rest.ts` exporting factory function
3. Add types to `app/plugins/repos.ts` → `RepoModules` interface
4. Create `use{Name}Query.ts` using `createCrudQuery` pattern (see step 5)
5. Use TanStack Query patterns from `app/lib/crud-query.ts`:
   ```typescript
   const queries = createCrudQuery('users', repo)
   const { data, isLoading } = queries.useListQuery(params)
   ```

### Form Validation Pattern

- Define schemas in `features/{name}/forms/schemas.ts` using Zod
- Use `vee-validate` with `@vee-validate/zod` for form handling
- Example: `app/features/users/forms/schemas.ts` (snake_case field names for backend)

```typescript
export const createUserSchema = z.object({
  emailAddress: z.string().email(),
  phoneNumber: z.string().min(10),
  roleId: z.string().min(1),
})
```

### Vue Query (TanStack Query) Patterns

- **List queries**: Use `keepPreviousData` placeholder to prevent UI flicker during pagination
- **URL sync**: Query composables sync page/filters with URL params (see `useUsersQuery.ts`)
- **Scoped queries**: Support multiple instances via `scope` parameter for nested tables
- **Optimistic updates**: Invalidate queries on mutation success via `queryClient.invalidateQueries()`

### Running Commands

```bash
pnpm dev              # Dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint (uses @antfu/eslint-config)
pnpm typecheck        # Vue-tsc type checking
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
```

### Testing Approach

- Unit tests: `tests/unit/**/*.test.ts` using Vitest + `@nuxt/test-utils`
- Mock Nuxt composables with `mockNuxtImport()` (see `tests/unit/composables/usePermissions.test.ts`)
- E2E tests: `tests/e2e/**/*.spec.ts` using Playwright
- Setup file: `tests/setup.ts` runs before all tests

## Important Conventions

### 1. Component & Composable Patterns

- **Dialogs**: Use `useDialog()` composable (see `app/composables/useDialog.ts`)
  ```typescript
  const dialog = useDialog()
  await dialog.open(MyFormComponent, { userId: '123' }, { title: 'Edit User' })
  ```
- **Toasts**: Use `useToast()` composable with vue-sonner
  ```typescript
  const toast = useToast()
  toast.success('User created successfully')
  ```
- **Permissions**: Use `usePermissions()` or `allows()` from nuxt-authorization
  ```typescript
  const { hasPermission } = usePermissions()
  const canEdit = await hasPermission('users:write')
  ```

### 2. Route Protection

- Protected routes: Use `definePageMeta({ middleware: 'auth' })` (default global)
- Public routes: `definePageMeta({ middleware: [] })` to skip auth
- Auth middleware: `app/middleware/auth.global.ts` redirects to `/auth/login`

### 3. Styling with UnoCSS + Shadcn

- Use utility classes: `text-sm`, `flex`, `items-center`, `gap-2`
- Shadcn components in `app/components/ui/` (Button, Input, Select, etc.)
- Theme configured in `uno.config.ts` with red primary color
- Icons via `@iconify/json/ph` (Phosphor icons): `<div i-ph-user />`

### 4. Environment Variables

Key runtime config (see `nuxt.config.ts`):

- `NUXT_API_GATEWAY_URL` - Backend API base URL
- `NUXT_PUBLIC_API_BASE_URL` - BFF proxy endpoint (defaults to `/api/proxy`)
- `NUXT_PUBLIC_REPO_PROVIDER` - Repository provider (rest/mock/gql)
- `NUXT_SESSION_PASSWORD` - Session encryption key (required)
- `NUXT_GENESYS_*` - Genesys Cloud integration (OAuth + widget)

### 5. API Client Usage

```typescript
// ✅ PREFERRED: Via repository pattern (enforced)
const { $repos } = useNuxtApp()
const users = await $repos.users.list({ page: 1 })

// ⚠️ EDGE CASE ONLY: Direct API access (avoid in components)
const { $api } = useNuxtApp()
const data = await $api('/v1/custom-endpoint')

// Raw API without case conversion (rare)
const { $apiRaw } = useNuxtApp()
```

### 6. Common Pitfalls

- **DON'T** call `$repos` directly in components - always use feature composables (e.g., `useUsersQuery`)
- **DON'T** use `$fetch` or `$api` directly in components - use repository pattern via feature composables
- **DON'T** create ad-hoc API calls - always create a proper repository + composable
- **DO** use `MaybeRefOrGetter<>` for query parameters to support reactive updates
- **DO** invalidate queries after mutations: `queryClient.invalidateQueries(['users'])`
- **DO** use `z.loose()` in Zod transport schemas to allow flexible backend responses

## Integration Points

### Genesys Cloud CRM

- OAuth integration: `app/plugins/genesys.ts`
- Screen pop composable: `useGenesysScreenPop()` for external CRM data
- Configured via `NUXT_GENESYS_*` environment variables

### Multi-Tenancy

- Tenant ID stored in cookie: `tenant_id`
- Access via `useTenantId()` and `setTenantId()`
- Auto-injected into all API requests via proxy header

## File Locations Reference

- **API client setup**: `app/plugins/api.ts`
- **Repository loader**: `app/plugins/repos.ts`
- **BFF proxy**: `server/api/proxy/[...path].ts`
- **CRUD query factory**: `app/lib/crud-query.ts`
- **Case conversion utils**: `utils/case-converter.ts`
- **UI components**: `app/components/ui/` (shadcn) + `app/components/` (custom)
- **Validation helpers**: `app/lib/validations/safe-parse.ts`
