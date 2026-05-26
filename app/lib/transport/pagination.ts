export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  q?: string
  [k: string]: unknown
}

/** normalize meta (pageSize/totalPages bisa namanya beda atau kosong) */
export function normalizePageMeta(meta: {
  total: number
  page: number
  pageSize?: number
  page_size?: number
  totalPages?: number
  total_pages?: number
}): Pick<Page<unknown>, 'total' | 'page' | 'pageSize' | 'totalPages'> {
  const pageSize = Number(meta.pageSize ?? meta.page_size ?? 10) || 10
  const total = Number(meta.total ?? 0)
  const page = Number(meta.page ?? 1) || 1
  const totalPages = Number(meta.totalPages ?? meta.total_pages ?? Math.max(1, Math.ceil(total / pageSize)))
  return { total, page, pageSize, totalPages }
}
