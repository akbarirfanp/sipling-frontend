import type { ChangePasswordCmd, CreateUserCmd, UpdateUserCmd, UpdateUserPayload, User, UsersRepository } from './domain'
import type { Page } from '~/lib/transport'

import { z } from 'zod'
import { zDetailEnvelope, zPageEnvelope } from '~/lib/transport/envelope'
import { nil } from '~/lib/utils'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zUserTransport = z.object({
  id: z.string().optional(),
  name: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  emailAddress: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  status: z.boolean().optional(),
  address: z.string().optional(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  roleName: z.string().optional().nullable(),
  createdByName: z.string().optional().nullable(),
  updatedByName: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  roles: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
}).loose()

function toDomainUser(t: z.infer<typeof zUserTransport>): User {
  return ({
    id: t.id ?? '',
    name: t.name ?? '',
    username: t.username ?? ((t.emailAddress ?? '')?.split('@')[0] ?? ''),
    email: t.email ?? '',
    address: t.address ?? '',
    status: typeof t.status === 'boolean' ? t.status : true,
    createdAt: t.createdAt ?? '',
    updatedAt: t.updatedAt ?? '',
    roleId: t.roleId ?? '',
    roleName: t.roleName ?? '',
    createdByName: t.createdByName ?? '',
    updatedByName: t.updatedByName ?? '',
    roles: t.roles ?? null,
  })
}

function toCreatePayload(c: CreateUserCmd) {
  return ({
    email: c.email,
    name: c.name,
    password: c.password,
    address: c.address,
    username: c.username ?? c.email.split('@')[0],
    roleId: c.roleId ?? '',
    status: typeof c.status === 'string' ? c.status === '1' : c.status ?? true,
  })
}

function toChangePasswordPayload(c: ChangePasswordCmd) {
  return ({
    password: c.password,
  })
}

function toUpdatePayload(c: UpdateUserCmd): UpdateUserPayload {
  const p: UpdateUserPayload = {}

  if (c.email !== undefined) {
    p.email = c.email
  }
  if (c.name !== undefined) {
    p.name = c.name
  }
  if (c.address !== undefined) {
    p.address = c.address
  }
  if (c.password !== undefined) {
    p.password = c.password
  }
  if (c.roleId !== undefined) {
    p.roleId = c.roleId
  }
  if (c.username !== undefined) {
    p.username
      = nil(c.username) ?? (c.email ? c.email.split('@')[0] : null)
  }
  if (c.status !== undefined) {
    p.status = c.status
  }
  return p
}

export default function makeUsersRestRepo($api: typeof $fetch): UsersRepository {
  const base = ('/v1').replace(/\/+$/, '')
  const zDetail = zDetailEnvelope(zUserTransport)

  return {
    async list(params) {
      const raw = await $api(`${base}/users`, { method: 'GET', query: params }) as any
      const outer = raw?.data

      const page: Page<User> = {
        items: (outer?.items ?? []).map((item: any) => toDomainUser({ ...item, userId: item.id })),
        total: outer?.total ?? 0,
        page: outer?.page ?? 1,
        pageSize: outer?.pageSize ?? 15,
        totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 15)),
      }
      return page
    },
    async get(id) {
      const raw = await $api(`${base}/users/${id}`, { method: 'GET' })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainUser(parsed.data)
    },
    async create(cmd) {
      const raw = await $api(`${base}/users`, { method: 'POST', body: toCreatePayload(cmd) })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainUser(parsed.data)
    },
    async update(id, cmd) {
      const raw = await $api(`${base}/users/${id}`, { method: 'PUT', body: toUpdatePayload(cmd) })
      const parsed = safeParseOrThrow(zDetail, raw)
      return toDomainUser(parsed.data)
    },
    async delete(id) {
      await $api(`${base}/users/${id}`, { method: 'DELETE' })
    },
    async changePassword(id, cmd) {
      await $api(`${base}/users/change-password/${id}`, { method: 'PUT', body: toChangePasswordPayload(cmd) })
    },
  }
}
