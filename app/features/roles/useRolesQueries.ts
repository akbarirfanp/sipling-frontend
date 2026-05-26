import type {
  CreateRoleCmd,
  ListRolesParams,
  Role,
  RolePermissionCmd,
  RolesRepository,
  UpdateRoleCmd,
} from './domain'
import type { CrudRepo } from '@/lib/crud-query'
import type { Page } from '~/lib/transport'
import { createCrudQuery } from '@/lib/crud-query'

let _rolesQueries: ReturnType<typeof buildRolesQueries> | null = null

export function useRolesQueries() {
  if (_rolesQueries)
    return _rolesQueries
  const { $repos } = useNuxtApp()
  const repo = $repos.roles as RolesRepository as unknown as CrudRepo<Role, ListRolesParams, Page<Role>, CreateRoleCmd, UpdateRoleCmd> & RolesRepository
  _rolesQueries = buildRolesQueries(repo)
  return _rolesQueries
}

function buildRolesQueries(repo: RolesRepository) {
  const crud = createCrudQuery<Role, ListRolesParams, Page<Role>, CreateRoleCmd, UpdateRoleCmd>(
    'roles',
    repo as CrudRepo<Role, ListRolesParams, Page<Role>, CreateRoleCmd, UpdateRoleCmd>,
  )

  // non-crud methods
  function useSetRolePerm(roleId: MaybeRefOrGetter<string>) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (permissionIds: RolePermissionCmd) => repo.setRolePerm(toValue(roleId)!, permissionIds),
      onSuccess: async () => {
        const id = toValue(roleId)!
        await Promise.all([crud.invalidateDetail(qc, id), crud.invalidateList(qc)])
      },
    })
  }

  function useGetPermissions() {
    return useQuery({
      queryKey: ['permissions'],
      queryFn: () => repo.getPermissions(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }

  return {
    ...crud,
    useSetRolePerm,
    useGetPermissions,
  }
}
