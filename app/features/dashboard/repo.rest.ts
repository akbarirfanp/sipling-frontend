import type { Dashboard, RecentActivity, DashboardRepository } from './domain'
import { z } from 'zod'
import { zDetailEnvelope } from '~/lib/transport/envelope'
import { safeParseOrThrow } from '~/lib/validations/safe-parse'

const zDashboardTransport = z.object({
    totalWarga: z.number().optional(),
    unpaidBill: z.number().optional(),
    monthlyIncome: z.number().optional(),
}).loose()

const zRecentActivityTransport = z.object({
    id: z.string(),
    bill_id: z.string(),
    payment_date: z.string(),
    status: z.string(),

    gross_amount: z.number(),

    user_id: z.string(),
    user_name: z.string(),

    fee_id: z.string(),
    fee_name: z.string(),
}).loose()

function toDomainDashboard(
    t: z.infer<typeof zDashboardTransport>,
): Dashboard {
    return {
        totalWarga: t.totalWarga ?? 0,
        unpaidBill: t.unpaidBill ?? 0,
        monthlyIncome: t.monthlyIncome ?? 0,
    }
}

function toDomainRecentActivity(
    item: z.infer<typeof zRecentActivityTransport>,
): RecentActivity {
    return {
        id: item.id,
        billId: item.bill_id,
        status: item.status,
        paymentDate: item.payment_date,

        grossAmount: item.gross_amount,

        userId: item.user_id,
        userName: item.user_name,

        feeId: item.fee_id,
        feeName: item.fee_name,
    }
}

export default function makeDashboardRestRepo(
    $api: typeof $fetch,
): DashboardRepository {
    const base = (
        (useRuntimeConfig().public?.accountServiceBase as string) || '/v1'
    ).replace(/\/+$/, '')

    const zDetailDashboard = zDetailEnvelope(zDashboardTransport)

    const zDetailRecent = zDetailEnvelope(
        z.array(zRecentActivityTransport),
    )

    return {
        async getDashboardStatistic() {
            const raw = await $api(`${base}/dashboard`, {
                method: 'GET',
            })

            const parsed = safeParseOrThrow(zDetailDashboard, raw)

            return toDomainDashboard(parsed.data)
        },

        async getRecentActivity() {
            const raw = await $api(
                `${base}/dashboard/recent-activity`,
                {
                    method: 'GET',
                },
            )

            const parsed = safeParseOrThrow(
                zDetailRecent,
                raw,
            )

            return parsed.data.map(toDomainRecentActivity)
        },
    }
}