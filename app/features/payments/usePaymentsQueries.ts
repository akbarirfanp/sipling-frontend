import type {
    Payment,
    PaymentsRepository,
    ListPaymentsParams,
} from './domain'
import type { CrudRepo } from '@/lib/crud-query'
import type { Page } from '~/lib/transport'
import { createCrudQuery } from '@/lib/crud-query'

let _paymentQueries: ReturnType<typeof buildPaymentQueries> | null = null

export function usePaymentsQueries() {
    if (_paymentQueries)
        return _paymentQueries
    const { $repos } = useNuxtApp()
    const repo = $repos.payments as PaymentsRepository as unknown as CrudRepo<Payment, ListPaymentsParams, Page<Payment>> & PaymentsRepository
    _paymentQueries = buildPaymentQueries(repo)
    return _paymentQueries
}

function buildPaymentQueries(repo: PaymentsRepository) {
    const crud = createCrudQuery<Payment, ListPaymentsParams, Page<Payment>, never, never>(
        'payments',
        repo as unknown as CrudRepo<Payment, ListPaymentsParams, Page<Payment>, never, never>,
    )

    return {
        ...crud,
    }
}
