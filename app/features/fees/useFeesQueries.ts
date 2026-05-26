import type {
  Fee,
  FeesRepository,
  CreateFeeCmd,
  ListFeesParams,
  UpdateFeeCmd,
} from './domain'
import type { CrudRepo } from '@/lib/crud-query'
import type { Page } from '~/lib/transport'
import { createCrudQuery } from '@/lib/crud-query'

let _feeQueries: ReturnType<typeof buildFeesQueries> | null = null

export function useFeesQueries() {
  if (_feeQueries)
    return _feeQueries
  const { $repos } = useNuxtApp()
  const repo = $repos.fees as FeesRepository as unknown as CrudRepo<Fee, ListFeesParams, Page<Fee>, CreateFeeCmd, UpdateFeeCmd> & FeesRepository
  _feeQueries = buildFeesQueries(repo)
  return _feeQueries
}

function buildFeesQueries(repo: FeesRepository) {
  const crud = createCrudQuery<Fee, ListFeesParams, Page<Fee>, CreateFeeCmd, UpdateFeeCmd>(
    'fees',
    repo as CrudRepo<Fee, ListFeesParams, Page<Fee>, CreateFeeCmd, UpdateFeeCmd>,
  )

  return {
    ...crud,
  }
}
