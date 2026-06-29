import { z } from 'zod'

/**
 * Schema untuk createform iuran
 */
export const createFeeSchema = z.object({
  name: z.string()
    .min(1, 'Nama iuran perlu diisi')
    .min(3, 'Nama iuran harus minimal 3 karakter')
    .max(100, 'Nama iuran tidak boleh lebih dari 100 karakter'),

  description: z.string()
    .min(1, 'Deskripsi perlu diisi')
    .min(3, 'Deskripsi harus minimal 3 karakter'),

  amount: z.coerce.number()
    .min(5000, 'Nominal minimal Rp 5.000'),

  period: z.enum(['Tahunan', 'Bulanan'])
    .refine(val => ['Tahunan', 'Bulanan'].includes(val), {
      message: 'Periode harus diantara tahunan dan bulanan',
    }),
})

export const updateFeeSchema = z.object({
  name: z.string()
    .min(1, 'Account name is required')
    .min(3, 'Account name must be at least 3 characters')
    .max(100, 'Account name must not exceed 100 characters'),

  description: z.string()
    .optional()
    .or(z.literal('')),

  website: z.string()
    .optional()
    .refine(
      val => !val || /^https?:\/\/.+\..+/.test(val),
      { message: 'Website must be a valid URL' },
    ),

  amount: z.coerce.number().optional(),

  period: z.enum(['Tahunan', 'Bulanan', 'Mingguan'])
    .refine(val => ['Tahunan', 'Bulanan', 'Mingguan'].includes(val), {
      message: 'Periode harus diantara tahunan, bulanan, dan mingguan',
    }),
})

export type CreateAccountFormData = z.infer<typeof createFeeSchema>

/**
 * Schema untuk update account form (semua field optional kecuali yang critical)
 */

// export type CreateAccountFormData = z.infer<typeof createAccountSchema>
