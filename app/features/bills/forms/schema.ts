import { z } from 'zod'

/**
 * Schema untuk create role form
 */
export const generateBillSchema = z.object({
  feeId: z
    .string()
    .min(3, 'Jenis iuran harus dipilih'),
  dueDate: z
    .string()
    .min(1, 'Tanggal jatuh tempo harus diisi!')
})

/**
 * Schema untuk update role form
 */


// Export types
export type GenerateBillFormData = z.infer<typeof generateBillSchema>
