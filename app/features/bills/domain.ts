import type { Page, PaginationParams } from '@/lib/transport'

export interface Bill {
    id: string
    invoiceNumber: string
    grossAmount: number
    status: string
    dueDate?: string | null
    user?: {
        id: string
        name: string
    } | null
    fee?: {
        id: string
        name: string
        description?: string
    } | null
    snapToken?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface BillDetail {
    id: string
    orderId: string
    feeId: string
    name: string
    price: number
    quantity: number
}

export interface GenerateBillCmd {
    feeId: string
    dueDate: string
}

export type ListBillsParams = PaginationParams & {
    status?: string
    user_id?: string
}

export interface BillsRepository {
    list: (params?: ListBillsParams) => Promise<Page<Bill>>
    get: (invoiceNumber: string) => Promise<Bill>
    generate: (cmd: GenerateBillCmd) => Promise<Bill>
}