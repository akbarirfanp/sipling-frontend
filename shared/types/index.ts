// Auth type definitions for nuxt-auth-utils
export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  name: string
  email: string
  roles: AuthRole[]
  tenantCode?: string
  token?: string
  expiresAt?: string
}

export interface AuthRole {
  id: string
  name: string
  tenantId: string
  pivot: {
    userId: string
    roleId: string
    createdAt: string
    updatedAt: string
  }
  permissions: AuthPermission[]
}

export interface AuthPermission {
  id: string
  name: string
  guardName: string
  created_at: string
  updated_at: string
  pivot: {
    roleId: string
    permissionId: string
  }
}

export interface LoginCredentials {
  emailAddress: string
  password: string
}

export interface LoginResponse {
  user: {
    userId: string
    username: string
    name: string
    email: string
    roles: AuthRole[]
  }
  tenantCode: string
  expiredAt: string
  token: string
  isExternal: boolean
}

export interface AuthSession {
  user: AuthUser
  token: string
  tenantCode: string
  expiresAt: string
  isExternal: boolean
}

// Global API types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  errors?: Record<string, string[]>
  status: string
  error: boolean
}

export interface ApiError {
  message: string
  status: number
  data?: any
}
