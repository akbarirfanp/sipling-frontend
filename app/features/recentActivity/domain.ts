import type { Page, PaginationParams } from '@/lib/transport'

export interface RecentActivity {
  id: string
  billId: string
  paymentDate: string
  status: string
  grossAmount: number
  userId: string
  userName: string
  feeId: string
  feeName: string
}

export type ListRecentActivityParams = PaginationParams

export interface RecentActivityRepository {
  list: (params?: ListRecentActivityParams) => Promise<Page<RecentActivity>>
}
