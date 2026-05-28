export function useTenantId() {
  return useState<string | null>('tenantId', () => useCookie<string | null>('tenant_id').value ?? null)
}

export function setTenantId(id: string | null) {
  useCookie('tenant_id', { sameSite: 'lax' }).value = id
  useTenantId().value = id
}
