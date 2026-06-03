import type { Payment, PaymentsRepository, ListPaymentsParams } from './domain'
import type { Page } from '~/lib/transport'
import { z } from 'zod'
import { zDetailEnvelope, zPageEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zPaymentTransport = z.object({
    id: z.string().optional(),
    amount: z.number().optional(),
    dueDate: z.string().optional().nullable(),
    paymentDate: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    snapToken: z.string().optional().nullable(),
    user: z.object({
        id: z.string(),
        name: z.string(),
    }).optional().nullable(),
    bill: z.object({
        id: z.string(),
        name: z.string(),
        invoiceNumber: z.string(),
        status: z.string(),
    }).optional().nullable(),
    fee: z.object({
        id: z.string(),
        name: z.string(),
    }).optional().nullable(),
}).loose()

function toDomainPayment(t: z.infer<typeof zPaymentTransport>): Payment {
    return {
        id: t.id ?? '',
        amount: t.amount ?? 0,
        dueDate: t.dueDate ?? '',
        paymentDate: t.paymentDate ?? '',
        status: t.status ?? '',
        snapToken: t.snapToken ?? '',
        user: {
            id: t.user?.id ?? '',
            name: t.user?.name ?? '',
        },
        bill: {
            id: t.bill?.id ?? '',
            name: t.bill?.name ?? '',
            invoiceNumber: t.bill?.invoiceNumber ?? '',
            status: t.bill?.status ?? '',
        },
        fee: {
            id: t.fee?.id ?? '',
            name: t.fee?.name ?? '',
        }
    }
}

export default function makePaymentsRepo($api: typeof $fetch): PaymentsRepository {
    const base = ((useRuntimeConfig().public?.accountServiceBase as string) || '/v1').replace(/\/+$/, '')
    const zDetail = zDetailEnvelope(zPaymentTransport)

    return {
        async list(params) {
            const raw = await $api(`${base}/payments/history`, { method: 'GET', query: params }) as any
            const outer = raw?.data

            const page: Page<Payment> = {
                items: (outer?.items ?? []).map((item: any) => toDomainPayment({ ...item })),
                total: outer?.total ?? 0,
                page: outer?.page ?? 1,
                pageSize: outer?.pageSize ?? 10,
                totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 10)),
            }
            return page
        },
        async getSnapToken(id: string) {
            const raw = await $api(`${base}/bills/snap-token/${id}`, { method: 'GET' }) as any
            const data = raw?.data
            return {
                id: data?.paymentId ?? '',
                amount: 0,
                status: data?.status ?? '',
                snapToken: data?.snapToken ?? '',
                user: data?.user ?? null,
                bill: { id: data?.billId ?? '', name: '', invoiceNumber: '' },
                fee: null,
            } as Payment
        },
        async getAllPayment(id: string) {
            const raw = await $api(`${base}/payments/history`, { method: 'GET' })
            const parsed = safeParseOrThrow(zDetail, raw)
            return toDomainPayment(parsed.data)
        },
    }
}