import type { Report, ReportRepository } from './domain'
import { z } from 'zod'
import type { Page } from '~/lib/transport'
import { zDetailEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'



const zReportTransport = z.object({
    id: z.string(),
    invoiceNumber: z.string(),
    paymentDate: z.string(),
    status: z.string(),
    grossAmount: z.number(),
    userName: z.string(),
    feeName: z.string(),
}).loose()

function toDomainReport(
    item: z.infer<typeof zReportTransport>,
): Report {
    return {
        invoiceNumber: item.invoiceNumber,
        status: item.status,
        paymentDate: item.paymentDate,
        grossAmount: item.grossAmount,
        userName: item.userName,
        feeName: item.feeName,
    }
}

export default function makeReportRestRepo(
    $api: typeof $fetch,
): ReportRepository {
    const base = (
        (useRuntimeConfig().public?.dashboardServiceBase as string) || '/v1'
    ).replace(/\/+$/, '')

    return {
        async list(params) {
            const raw = await $api(`${base}/dashboard/generate-report`, { method: 'GET', query: params }) as any
            const outer = raw?.data

            const page: Page<Report> = {
                items: (outer?.items ?? []).map((item: any) => toDomainReport({ ...item, userId: item.id })),
                total: outer?.total ?? 0,
                page: outer?.page ?? 1,
                pageSize: outer?.pageSize ?? 15,
                totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 15)),
            }
            return page
        },
    }
}