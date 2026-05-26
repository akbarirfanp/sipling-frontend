import type {
  Bill,
  BillsRepository,
  GenerateBillCmd,
  ListBillsParams,
} from './domain'
import type { CrudRepo } from '@/lib/crud-query'
import type { Page } from '~/lib/transport'
import { createCrudQuery } from '@/lib/crud-query'

let _billQueries: ReturnType<typeof buildBillsQueries> | null = null

export function useBillsQueries() {
  if (_billQueries)
    return _billQueries
  const { $repos } = useNuxtApp()
  const repo = $repos.bills as BillsRepository as unknown as CrudRepo<Bill, ListBillsParams, Page<Bill>, GenerateBillCmd> & BillsRepository
  _billQueries = buildBillsQueries(repo)
  return _billQueries
}

function buildBillsQueries(repo: BillsRepository) {
  const crud = createCrudQuery<Bill, ListBillsParams, Page<Bill>, GenerateBillCmd, never>(
    'bills',
    repo as unknown as CrudRepo<Bill, ListBillsParams, Page<Bill>, GenerateBillCmd>,
  )

  return {
    ...crud,
  }
}
