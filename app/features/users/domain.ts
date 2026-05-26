import type { Page, PaginationParams } from '@/lib/transport'

export interface User {
  id: string
  number?: string | null
  name: string
  username?: string | null
  address: string
  email?: string | null
  // phoneNumber?: string | null
  status: boolean
  roleId?: string | null
  roleName?: string
  roles?: {
    id: string
    name: string
  } | null
  createdAt?: string | null
  updatedAt?: string | null
  createdByName?: string | null
  updatedByName?: string | null
}

export interface CreateUserCmd {
  name: string
  email: string
  address: string
  password: string
  username?: string | null
  roleId?: string | null
  status?: boolean
}

export interface ChangePasswordCmd {
  password: string
}

export type UpdateUserCmd = Partial<CreateUserCmd>
// export type ListUsersParams = PaginationParams
export type ListUsersParams = PaginationParams & {
  memberQueue?: string
  memberDivision?: string
  isAdmin?: string
}

export type UpdateUserPayload = Partial<{
  name: string
  email: string
  roleId?: string | null
  password: string
  address: string
  username?: string | null
  status?: boolean
}>

export interface UsersRepository {
  list: (params?: ListUsersParams) => Promise<Page<User>>
  get: (id: string) => Promise<User>
  create: (cmd: CreateUserCmd) => Promise<User>
  update: (id: string, cmd: UpdateUserCmd) => Promise<User>
  delete: (id: string) => Promise<void>
  changePassword: (id: string, cmd: ChangePasswordCmd) => Promise<void>
}
