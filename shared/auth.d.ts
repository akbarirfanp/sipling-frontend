declare module '#auth-utils' {
  interface User extends AuthUser {}
  interface UserSession extends AuthSession {}
  interface SecureSessionData {
    token?: string
    expiredAt?: number
  }
}

export {}
