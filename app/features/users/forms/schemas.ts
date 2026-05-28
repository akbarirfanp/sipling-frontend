import { z } from 'zod'

/**
 * Schema untuk create user form
 */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .min(4, 'Username harus memiliki minimal 4 karakter')
    .max(30, 'Username tidak boleh lebih dari 30 karakter')
    .regex(/^[A-Z]+$/i, 'Username harus berisi huruf dan tidak boleh spasi'),
  name: z
    .string()
    .min(1, 'Nama wajib diisi')
    .min(6, 'Name harus memiliki minimal 6 karakter')
    .max(60, 'Nama tidak boleh lebih dari 60 karakter')
    .regex(/^[A-Z\s]+$/i, 'Name hanya boleh berisi huruf'),
  roleId: z
    .string()
    .min(1, 'Role wajib diisi'),
  status: z
    .string()
    .min(1, 'Status wajib diisi'),
  emailAddress: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Alamat email tidak valid'),
  address: z
    .string()
    .min(1, 'Alamat harus diisi')
    .max(60, 'Alamat tidak boleh lebih dari 120 karakter'),
})

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(4, 'Username must be at least 4 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[A-Z]+$/i, 'Username must only contain letters and no space'),
  name: z
    .string()
    .min(1, 'Name is required')
    .min(6, 'Name must be at least 6 characters')
    .max(60, 'Name must not exceed 60 characters')
    .regex(/^[A-Z\s]+$/i, 'Name must only contain letters'),
  roleId: z
    .string()
    .min(1, 'Role is required'),
  status: z
    .string()
    .min(1, 'Status is required'),
  emailAddress: z
    .string()
    .min(1, 'Email address is required')
    .email('Email address must be a valid email'),
  address: z
    .string()
    .min(1, 'Deskripsi harus diisi')
    .max(60, 'Deskripsi tidak boleh lebih dari 120 karakter')
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
