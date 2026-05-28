import type { Bill, BillsRepository, GenerateBillCmd, ListBillsParams } from './domain'
import type { Page } from '~/lib/transport'
import { z } from 'zod'
import { zDetailEnvelope, zPageEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zBillTransport = z.object({
    id: z.string().optional(),
    invoiceNumber: z.string().optional().nullable(),
    grossAmount: z.number().optional(),
    billId: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    user: z.object({
        id: z.string(),
        name: z.string(),
    }).optional().nullable(),
    fee: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
    }).optional().nullable(),
}).loose()

function toDomainBill(t: z.infer<typeof zBillTransport>): Bill {
    return {
        id: t.id ?? '',
        invoiceNumber: t.invoiceNumber ?? '',
        grossAmount: t.grossAmount ?? 0,
        dueDate: t.dueDate ?? '',
        status: t.status ?? '',
        user: t.user ?? null,
        fee: t.fee ?? null
    }
}

function toGeneratePayload(c: GenerateBillCmd) {
    return c
}


export default function makeBillsRestRepo($api: typeof $fetch): BillsRepository {
    const base = ((useRuntimeConfig().public?.accountServiceBase as string) || '/v1').replace(/\/+$/, '')
    const zList = zPageEnvelope(zBillTransport)
    const zDetail = zDetailEnvelope(zBillTransport)

    return {
        async list(params) {
            const raw = await $api(`${base}/bills`, { method: 'GET', query: params }) as any
            const outer = raw?.data

            const page: Page<Bill> = {
                items: (outer?.items ?? []).map((item: any) => toDomainBill({ ...item, feeId: item.id })),
                total: outer?.total ?? 0,
                page: outer?.page ?? 1,
                pageSize: outer?.pageSize ?? 10,
                totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 10)),
            }
            return page
        },
        async get(id) {
            const raw = await $api(`${base}/bills/${id}`, { method: 'GET' })
            const parsed = safeParseOrThrow(zDetail, raw)
            return toDomainBill(parsed.data)
        },
        async generate(cmd) {
            const raw = await $api(`${base}/bills/generate-bill`, { method: 'POST', body: toGeneratePayload(cmd) })
            const parsed = safeParseOrThrow(zDetail, raw)
            return toDomainBill(parsed.data)
        },
    }
}