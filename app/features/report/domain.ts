import type { Page, PaginationParams } from '@/lib/transport'

export interface Report {
  paymentDate: string
  invoiceNumber: string
  grossAmount: number
  status: string
  userName: string
  feeName: string
}

export type ListReportParams = PaginationParams & {
  start_date?: string
  end_date?: string
}

export interface ReportRepository {
  list: (params?: ListReportParams) => Promise<Page<Report>>
}
