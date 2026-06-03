import type { Role, RolesRepository, UpdateRoleCmd } from './domain'
import type { Page } from '~/lib/transport'

import { z } from 'zod'
import { zDetailEnvelope, zPageEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zRoleTransport = z.object({
  id: z.string(),
  name: z.string(),
  status: z.boolean().optional().default(true),
}).loose()

// Schema untuk role list (lebih simple)
const zRoleListTransport = z.object({
  id: z.string(),
  name: z.string(),
  status: z.boolean().optional().default(true),
  roleNumber: z.string().optional(),
}).loose()

function toDomainRole(t: z.infer<typeof zRoleTransport>): Role {
  return {
    id: t.id,
    name: t.name,
    status: t.status,
  }
}

function toDomainRoleList(t: z.infer<typeof zRoleListTransport>): Role {
  return {
    id: t.id,
    name: t.name,
    status: t.status,
  }
}

function toUpdatePayload({ name, status }: UpdateRoleCmd): Partial<{ name: string, status: boolean }> {
  const payload: Partial<{ name: string, status: boolean }> = {}

  if (name !== undefined) {
    payload.name = name
  }

  if (status !== undefined) {
    payload.status = status
  }

  return payload
}

export default function makeRolesRestRepo($api: typeof $fetch): RolesRepository {
  const base = ((useRuntimeConfig().public?.roleServiceBase as string) || '/v1').replace(/\/+$/, '')
  const zList = zPageEnvelope(zRoleListTransport)
  const zDetail = zDetailEnvelope(zRoleTransport)

  return {
    async list(params) {
      const raw = await $api(`${base}/roles`, { method: 'GET', query: params })
      const parsed = safeParseOrThrow(zList, raw)
      const data = parsed.data
      const page: Page<Role> = {
        items: data.items.map(toDomainRoleList),
        total: Number(data.total),
        page: Number(data.page),
        pageSize: Number((data).pageSize ?? 10),
        totalPages: Number((data).totalPages ?? Math.max(1, Math.ceil(Number(data.total) / Number((data).pageSize ?? 10)))),
      }
      return page
    },
    async get(id) {
      const raw = await $api(`${base}/${id}`, { method: 'GET' })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainRole(parsed.data)
    },
    async update(id, cmd) {
      const raw = await $api(`${base}/${id}`, { method: 'PUT', body: toUpdatePayload(cmd) })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainRole(parsed.data)
    },
    async delete(id) {
      await $api(`${base}/${id}`, { method: 'DELETE' })
    },
  }
}
