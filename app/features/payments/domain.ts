import type { Page, PaginationParams } from '@/lib/transport'

export interface Payment {
    id: string
    amount?: number
    dueDate?: string | null
    paymentDate?: string
    bill?: {
        id?: string
        name?: string
        invoiceNumber?: string
        status?: string
    } | null
    user?: {
        id: string
        name: string
    } | null
    fee?: {
        id?: string
        name?: string
    } | null
    status: string
    snapToken?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

export interface PaymentDetail {
    id: string
    amount?: number
    dueDate?: string | null
    bill?: {
        id?: string
        name?: string
        invoiceId?: string
        grossAmount?: number

    } | null
    fee?: {
        id?: string
        name?: string
    } | null
    status: string
    snapToken?: string | null
    createdAt?: string | null
    updatedAt?: string | null
}

export type ListPaymentsParams = PaginationParams

export interface PaymentsRepository {
    list: (params?: ListPaymentsParams) => Promise<Page<Payment>>
    getSnapToken: (id: string) => Promise<Payment>
    getAllPayment: (id: string) => Promise<Payment>
}