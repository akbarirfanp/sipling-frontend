import type { Page, PaginationParams } from '@/lib/transport'



export interface Role {
  id: string
  name: string
  status?: boolean
}

export interface RoleCreateResponse {
  id: string
  name: string
  status?: boolean
}

export interface CreateRoleCmd {
  id: string
  name: string
  status?: boolean
}

export interface UpdateRoleCmd {
  id: string
  name: string
  status?: boolean
}

export type ListRolesParams = PaginationParams

export interface RolesRepository {
  list: (params?: ListRolesParams) => Promise<Page<Role>>
  get: (id: string) => Promise<Role>
  update: (id: string, cmd: UpdateRoleCmd) => Promise<Role>
  delete: (id: string) => Promise<void>
}
