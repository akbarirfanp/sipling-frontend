import type { CreateUserCmd, UpdateUserCmd, User, UsersRepository } from './domain'
import type { Page } from '~/lib/transport'

export default function makeUsersMockRepo(): UsersRepository {
  const store: Record<string, User[]> = {}
  const tenant = () => useCookie('tenant_id').value || 'default'
  const seed = (t: string) => {
    if (store[t])
      return
    store[t] = [
      { id: 'u-1', number: 'USR-0001', name: 'Agus', username: 'agus', email: 'agus@example.com', status: true, createdAt: null, updatedAt: null },
      { id: 'u-2', number: 'USR-0002', name: 'Budi', username: 'budi', email: 'budi@example.com', status: true, createdAt: null, updatedAt: null },
    ]
  }
  return {
    async list(params) {
      const t = tenant()
      seed(t)

      const page = Number(params?.page ?? 1)
      const pageSize = Number(params?.pageSize ?? 10)
      const q = (params?.q || '').toString().toLowerCase()
      const all = store[t]!.filter(u => !q || [u.name, u.email, u.username, u.number].some(x => (x || '').toLowerCase().includes(q)))
      const total = all.length
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      const items = all.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
      await new Promise(r => setTimeout(r, 80))
      return { items, total, page, pageSize, totalPages } as Page<User>
    },
    async get(id) {
      const t = tenant()
      seed(t)
      const u = store[t]!.find(x => x.id === id)

      if (!u) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
      }
      await new Promise(r => setTimeout(r, 50))

      return structuredClone(u)
    },
    async create(cmd: CreateUserCmd) {
      const t = tenant()
      seed(t)
      const arr = store[t]!
      const now = new Date().toISOString()
      const nu: User = {
        id: crypto.randomUUID(),
        number: `USR-${String(arr.length + 1).padStart(4, '0')}`,
        name: cmd.name,
        username: cmd.username ?? cmd.email.split('@')[0],
        email: cmd.email,
        phoneNumber: cmd.phoneNumber ?? null,
        status: cmd.status ?? true,
        createdAt: now,
        updatedAt: now,
      }
      arr.unshift(nu)
      await new Promise(r => setTimeout(r, 70))

      return structuredClone(nu)
    },
    async update(id, cmd: UpdateUserCmd) {
      const t = tenant()
      seed(t)
      const i = store[t]!.findIndex(x => x.id === id)

      if (i < 0)
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
      const up = { ...store[t]![i], ...cmd, updatedAt: new Date().toISOString() }
      store[t]![i] = up as User
      await new Promise(r => setTimeout(r, 60))

      return structuredClone(store[t]![i])
    },
    async delete(id) {
      const t = tenant()
      seed(t)
      const i = store[t]!.findIndex(x => x.id === id)

      if (i >= 0) {
        store[t]!.splice(i, 1)
      }
      await new Promise(r => setTimeout(r, 40))
    },

    async changePassword(id, _cmd) {
      const t = tenant()
      seed(t)
      const i = store[t]!.findIndex(u => u.id === id)
      if (i < 0)
        throw createError({ statusCode: 404, statusMessage: 'User not found' })
      // Mock implementation - in real app, password would be hashed
      // For mock, we just acknowledge the change
    },
  }
}
