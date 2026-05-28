# Manual Testing Guide: Auth & Permission Integration

Panduan testing manual untuk integrasi sistem autentikasi dan otorisasi menggunakan `nuxt-auth-utils` dan `nuxt-authorization`.

## Prerequisites

- Server development berjalan (`pnpm dev`)
- Browser dengan developer tools
- Access ke aplikasi di `http://localhost:3000`

## Test Cases

### 1. Authentication Flow Testing

#### 1.1 Login Process

```bash
# Buka browser dan navigate ke:
http://localhost:3000/auth/login

# Test credentials:
- Email: admin@example.com
- Password: password123
```

**Expected Results:**

- ✅ Redirect ke dashboard setelah login sukses
- ✅ Session tersimpan di browser
- ✅ User data tersedia di `useUserSession()`

#### 1.2 Session Management

```javascript
// Test di browser console:
const { user, loggedIn } = useUserSession()
console.log('User:', user.value)
console.log('Logged in:', loggedIn.value)
```

**Expected Results:**

- ✅ `user.value` berisi data user yang login
- ✅ `loggedIn.value` adalah `true`
- ✅ Session persist setelah refresh page

### 2. Permission System Test

#### Test Component-Level Permissions

1. Login sebagai different roles
2. Navigate ke pages yang ada permission guards
3. Check apakah content muncul sesuai dengan role

#### Test Areas:

- **Admin Dashboard**: Hanya admin yang bisa akses
- **User Management**: Admin dan Manager
- **Genesys Queue**: Agent dan Supervisor
- **Reports**: Manager dan Admin

### 3. Middleware Test

#### Test Route Protection

1. Coba akses protected routes tanpa login
2. Verify redirect ke `/auth/login`
3. Login dan coba akses routes yang tidak sesuai role
4. Verify redirect atau access denied

#### Protected Routes:

- `/dashboard/admin` - Admin only
- `/dashboard/manager` - Manager only
- `/users` - Admin & Manager
- `/genesys` - Genesys roles only

### 4. UI Component Test

#### Test PermissionGuard Component

```vue
<!-- Add this to any page for testing -->
<template>
  <div>
    <PermissionGuard :ability="canAccessAdminPanel">
      <div class="p-4 bg-red-100">
        Admin Only Content
      </div>
      <template #fallback>
        <div class="p-4 bg-gray-100">
          Access Denied
        </div>
      </template>
    </PermissionGuard>
  </div>
</template>
```

#### Test RoleGuard Component

```vue
<template>
  <RoleGuard :roles="['admin', 'manager']">
    <div class="p-4 bg-blue-100">
      Admin or Manager Content
    </div>
    <template #fallback>
      <div class="p-4 bg-gray-100">
        Role Access Denied
      </div>
    </template>
  </RoleGuard>
</template>
```

#### Test Permission Directive

```vue
<template>
  <div>
    <button v-permission="canDeleteUser" class="btn-danger btn">
      Delete User (Admin Only)
    </button>

    <div v-permission:role="['manager', 'admin']">
      Manager/Admin Content
    </div>

    <span v-permission:any="[canEdit, canDelete]">
      Edit/Delete Actions
    </span>
  </div>
</template>
```

### 5. Genesys Integration Test

#### Test Genesys-Specific Roles

1. Login dengan Genesys roles:
   - `genesys_admin`
   - `genesys_supervisor`
   - `genesys_agent`
2. Verify access ke Genesys-specific features:
   - Queue Management
   - Agent Panel
   - Call Handling
   - Workforce Management

### 6. Session Management Test

#### Test Session Persistence

1. Login dan refresh page
2. Verify user tetap logged in
3. Check session data di browser storage
4. Test logout functionality

#### Test Multi-Tenant

1. Switch tenant (jika ada)
2. Verify permissions berubah sesuai tenant
3. Check API calls include correct tenant headers

## Browser Console Tests

### Check Composables

```javascript
// Test di browser console
const { can, hasPermission } = usePermissions()
const { user } = useUserSession()

// Check user data
console.log('Current user:', user.value)

// Test permissions
can(canAccessAdminPanel).then((result) => {
  console.log('Can access admin panel:', result)
})

// Test reactive permissions
const adminAccess = hasPermission(canAccessAdminPanel)
console.log('Reactive admin access:', adminAccess.value)
```

### Check Abilities

```javascript
// Import abilities
import {
  canAccessAdminDashboard,
  canAccessGenesysQueue,
  viewDashboard
} from '~/shared/utils/abilities'

// Test abilities
allows(canAccessAdminDashboard).then((result) => {
  console.log('Admin dashboard access:', result)
})

allows(canAccessGenesysQueue).then((result) => {
  console.log('Genesys queue access:', result)
})
```

## API Integration Test

### Check Authorization Headers

1. Open Network tab di dev tools
2. Make API calls
3. Verify headers include:
   - `Authorization: Bearer <token>`
   - `X-Tenant-ID: <tenant_id>`

### Test API Endpoints

```javascript
// Test API calls dengan permission
const { api } = useApi()

// Should work for authorized users
api('/v1/users').then((users) => {
  console.log('Users:', users)
}).catch((error) => {
  console.error('API Error:', error)
})
```

## Expected Behaviors

### ✅ Success Indicators

- [ ] Login redirects ke correct dashboard
- [ ] Protected content shows/hides correctly
- [ ] Permission directives work
- [ ] API calls include auth headers
- [ ] Session persists across refreshes
- [ ] Logout clears session
- [ ] Role-based access works
- [ ] Genesys permissions work

### ❌ Error Indicators

- [ ] Console errors related to permissions
- [ ] Infinite redirect loops
- [ ] Content shows when it shouldn't
- [ ] API calls fail with 401/403
- [ ] Session not persisting
- [ ] Wrong dashboard redirects

## Troubleshooting

### Common Issues

1. **Permission always false**: Check user session and role data
2. **Redirect loops**: Check middleware logic
3. **API 401 errors**: Check token and headers
4. **Components not showing**: Check ability definitions

### Debug Commands

```javascript
// Check current session
console.log('Session:', await $fetch('/api/auth/session'))

// Check abilities
console.log('Abilities loaded:', Object.keys(window.__NUXT__.abilities || {}))

// Check user permissions
const { user } = useUserSession()
console.log('User roles:', user.value?.roles)
console.log('User permissions:', user.value?.permissions)
```

## Notes

- Semua test harus dilakukan dengan different user roles
- Check browser console untuk errors
- Verify network requests di dev tools
- Test dengan mock mode enabled dan disabled
