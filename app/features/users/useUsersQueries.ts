import type {
  CreateUserCmd,
  ListUsersParams,
  UpdateUserCmd,
  User,
  UsersRepository,
} from './domain'
import type { CrudRepo } from '@/lib/crud-query'
import type { Page } from '~/lib/transport'
import { createCrudQuery } from '@/lib/crud-query'

let _usersQueries: ReturnType<typeof buildUsersQueries> | null = null

export function useUsersQueries() {
  if (_usersQueries)
    return _usersQueries
  const { $repos } = useNuxtApp()
  const repo = $repos.users as UsersRepository as unknown as CrudRepo<User, ListUsersParams, Page<User>, CreateUserCmd, UpdateUserCmd> & UsersRepository
  _usersQueries = buildUsersQueries(repo)
  return _usersQueries
}

function buildUsersQueries(repo: UsersRepository) {
  const crud = createCrudQuery<User, ListUsersParams, Page<User>, CreateUserCmd, UpdateUserCmd>(
    'users',
    repo as CrudRepo<User, ListUsersParams, Page<User>, CreateUserCmd, UpdateUserCmd>,
  )

  return {
    ...crud,
  }
}
