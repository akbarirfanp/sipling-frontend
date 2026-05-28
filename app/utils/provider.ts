export type Provider = 'rest' | 'mock' | 'gql'

const isTrue = (v: any) => v === true || v === 'true' || v === '1' || v === 1

export function providerFor(feature: string): Provider {
  const rc = useRuntimeConfig()
  // global: mock on if NUXT_PUBLIC_MOCK truthy
  const globalDefault = (rc.public.repoProvider || (isTrue(rc.public.mock) ? 'mock' : 'rest')) as Provider
  // per-feature: repoUsers → users, repoLeads → leads, dst
  const key = feature && feature.length > 0 ? `repo${feature.charAt(0).toUpperCase()}${feature.slice(1)}` : 'repo'
  const per = (rc.public as any)[key] as Provider | undefined
  return (per || globalDefault) as Provider
}
