import type { Page, PaginationParams } from '@/lib/transport'

export interface Fee {
  id: string
  name: string
  amount: number
  description: string | null
  period: string | null
  createdAt: string
  updatedAt: string
  createdByName: string
  updatedByName: string
}

export interface CreateFeeCmd {
  name: string
  amount: number
  description: string | null
  period: string | null
}

export type UpdateFeeCmd = Partial<CreateFeeCmd>
export type ListFeesParams = PaginationParams

export interface FeesRepository {
  list: (params?: ListFeesParams) => Promise<Page<Fee>>
  get: (id: string) => Promise<Fee>
  create: (cmd: CreateFeeCmd) => Promise<Fee>
  update: (id: string, cmd: UpdateFeeCmd) => Promise<Fee>
  delete: (id: string) => Promise<void>

}
