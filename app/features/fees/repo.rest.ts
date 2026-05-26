import type { Fee, FeesRepository, CreateFeeCmd, ListFeesParams, UpdateFeeCmd } from './domain'
import type { Page } from '@/lib/transport'

import { z } from 'zod'
import { zDetailEnvelope, zPageEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zFeeTransport = z.object({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  amount: z.number().optional(),
  description: z.string().optional().nullable(),
  period: z.string().optional().nullable(),

  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdByName: z.string().optional().nullable(),
  updatedByName: z.string().optional().nullable(),
}).loose()

function toDomainFee(t: z.infer<typeof zFeeTransport>): Fee {
  return {
    id: t.id ?? '',
    name: t.name ?? '',
    amount: t.amount ?? 0,
    description: t.description ?? '',
    period: t.period ?? '',

    createdAt: t.createdAt ?? '',
    updatedAt: t.updatedAt ?? '',
    createdByName: t.createdByName ?? '',
    updatedByName: t.updatedByName ?? '',
  }
}

function toCreatePayload(c: CreateFeeCmd) {
  return c
}

function toUpdatePayload(c: UpdateFeeCmd) {
  return c
}

export default function makeFeeRestRepo($api: typeof $fetch): FeesRepository {
  const base = ((useRuntimeConfig().public?.accountServiceBase as string) || '/v1').replace(/\/+$/, '')
  const zList = zPageEnvelope(zFeeTransport)
  const zDetail = zDetailEnvelope(zFeeTransport)

  return {
    async list(params) {
      const raw = await $api(`${base}/fees`, { method: 'GET', query: params }) as any
      const outer = raw?.data

      const page: Page<Fee> = {
        items: (outer?.items ?? []).map((item: any) => toDomainFee({ ...item, feeId: item.id })),
        total: outer?.total ?? 0,
        page: outer?.page ?? 1,
        pageSize: outer?.pageSize ?? 10,
        totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 10)),
      }
      return page
    },
    async get(id) {
      const raw = await $api(`${base}/fees/${id}`, { method: 'GET' })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainFee(parsed.data)
    },
    async create(cmd) {
      const raw = await $api(`${base}/fees`, { method: 'POST', body: toCreatePayload(cmd) })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainFee(parsed.data)
    },
    async update(id, cmd) {
      const raw = await $api(`${base}/fees/${id}`, { method: 'PUT', body: toUpdatePayload(cmd) })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainFee(parsed.data)
    },
    async delete(id) {
      await $api(`${base}/fees/${id}`, { method: 'DELETE' })
    },
  }
}
