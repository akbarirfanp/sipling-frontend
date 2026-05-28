import type { RecentActivity, RecentActivityRepository } from './domain'
import { z } from 'zod'
import type { Page } from '~/lib/transport'
import { zDetailEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'



const zRecentActivityTransport = z.object({
    id: z.string(),
    billId: z.string(),
    paymentDate: z.string(),
    status: z.string(),

    grossAmount: z.number(),

    userId: z.string(),
    userName: z.string(),

    feeId: z.string(),
    feeName: z.string(),
}).loose()

function toDomainRecentActivity(
    item: z.infer<typeof zRecentActivityTransport>,
): RecentActivity {
    return {
        id: item.id,
        billId: item.billId,
        status: item.status,
        paymentDate: item.paymentDate,

        grossAmount: item.grossAmount,

        userId: item.userId,
        userName: item.userName,

        feeId: item.feeId,
        feeName: item.feeName,
    }
}

export default function makeRecentActivityRestRepo(
    $api: typeof $fetch,
): RecentActivityRepository {
    const base = (
        (useRuntimeConfig().public?.dashboardServiceBase as string) || '/v1'
    ).replace(/\/+$/, '')

    return {
        async list(params) {
            const raw = await $api(`${base}/dashboard/recent-activity`, { method: 'GET', query: params }) as any
            const outer = raw?.data

            const page: Page<RecentActivity> = {
                items: (outer?.items ?? []).map((item: any) => toDomainRecentActivity({ ...item, userId: item.id })),
                total: outer?.total ?? 0,
                page: outer?.page ?? 1,
                pageSize: outer?.pageSize ?? 15,
                totalPages: Math.ceil((outer?.total ?? 0) / (outer?.pageSize ?? 15)),
            }
            return page
        },
    }
}