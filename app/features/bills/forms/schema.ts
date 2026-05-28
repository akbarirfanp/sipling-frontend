import { z } from 'zod'

/**
 * Schema untuk create role form
 */
export const generateBillSchema = z.object({
  feeId: z
    .string()
    .min(1, 'Role name is required')
    .min(3, 'Role name must be at least 3 characters')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[\w\s\-]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  dueDate: z
    .string()
    .min(1, 'Tanggal jatuh tempo harus diisi!')
})

/**
 * Schema untuk update role form
 */


// Export types
export type GenerateBillFormData = z.infer<typeof generateBillSchema>
