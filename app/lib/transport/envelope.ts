import { z } from 'zod'

/** angka yang kadang string */
const zNum = z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)])

/** Detail envelope: { data: T } */
export function zDetailEnvelope<T extends z.ZodTypeAny>(Item: T) {
  return z.object({
    error: z.boolean().optional(),
    status: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
    data: Item,
  })
}

/** Page envelope: { data: { total, page, pageSize|page_size, totalPages|total_pages, items: T[] } } */
export function zPageEnvelope<T extends z.ZodTypeAny>(Item: T) {
  return z.object({
    error: z.boolean().optional(),
    status: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
    data: z.object({
      total: zNum,
      page: zNum,
      pageSize: zNum.optional(),
      // page_size: zNum.optional(),
      totalPages: zNum.optional(),
      // total_pages: zNum.optional(),
      items: z.array(Item),
    }),
  })
}
