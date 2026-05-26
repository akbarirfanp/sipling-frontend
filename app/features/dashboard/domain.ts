// import type { Page, PaginationParams } from '@/lib/transport'

export interface Dashboard {
  totalWarga: number
  unpaidBill: number
  monthlyIncome: number
}

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


export interface DashboardRepository {
  getDashboardStatistic: () => Promise<Dashboard>
  getRecentActivity: () => Promise<RecentActivity[]>
}
