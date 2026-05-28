import type { UsersRepository } from '~/features/users/domain'
import type { FeesRepository } from '~/features/fees/domain'
import type { RolesRepository } from '~/features/roles/domain'
import type { BillsRepository } from '~/features/bills/domain'
import type { PaymentsRepository } from '~/features/payments/domain'
import type { DashboardRepository } from '~/features/dashboard/domain'
import type { RecentActivityRepository } from '~/features/recentActivity/domain'
import type { ReportRepository } from '~/features/report/domain'

type Provider = 'rest' | 'mock' | 'gql'
const isTrue = (v: any) => v === true || v === 'true' || v === '1' || v === 1

export interface RepoModules {
  users: UsersRepository
  fees: FeesRepository
  roles: RolesRepository
  bills: BillsRepository
  payments: PaymentsRepository
  dashboard: DashboardRepository
  recentActivity: RecentActivityRepository
  report: ReportRepository
}
export type Repos = RepoModules

export default defineNuxtPlugin(async (nuxtApp) => {
  const rc = useRuntimeConfig()
  const $api = nuxtApp.$api as typeof $fetch

  const defaultProv = (rc.public.repoProvider || (isTrue(rc.public.mock) ? 'mock' : 'rest')) as Provider
  const restMods = import.meta.glob('@/features/*/repo.rest.ts')
  const mockMods = import.meta.glob('@/features/*/repo.mock.ts')
  const gqlMods = import.meta.glob('@/features/*/repo.gql.ts')

  // daftar feature dari folder
  const featureNames = Array.from(new Set([
    ...Object.keys(restMods),
    ...Object.keys(mockMods),
    ...Object.keys(gqlMods),
  ].map(p => p.split('/').at(-2)!)))

  const repos: any = {}

  // helper ambil provider per feature dari runtimeConfig: repoUsers → "users"
  const providerFor = (feature: string): Provider => {
    const key = feature && feature.length > 0 ? `repo${feature.charAt(0).toUpperCase()}${feature.slice(1)}` : 'repo'
    return ((rc.public as any)[key] as Provider) || defaultProv
  }

  for (const feature of featureNames) {
    const prov = providerFor(feature)
    const restKey = Object.keys(restMods).find(k => k.endsWith(`/${feature}/repo.rest.ts`))
    const mockKey = Object.keys(mockMods).find(k => k.endsWith(`/${feature}/repo.mock.ts`))
    const gqlKey = Object.keys(gqlMods).find(k => k.endsWith(`/${feature}/repo.gql.ts`))
    const pick
      = prov === 'rest'
        ? restMods[restKey!]
        : prov === 'mock'
          ? mockMods[mockKey!]
          : gqlMods[gqlKey!]

    if (!pick) {
      throw new Error(`[repos] adapter "${prov}" nggak ada buat feature "${feature}"`)
    }

    const mod: any = await pick()
    const makeRepo: any = mod.default
    repos[feature] = prov === 'mock' ? await makeRepo() : await makeRepo($api)
  }

  return { provide: { repos } }
})
