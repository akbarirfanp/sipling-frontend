import { z } from 'zod'

export const LoginCamelDto = z.object({
  error: z.boolean(),
  status: z.string().optional(),
  message: z.string().optional(),
  data: z.object({
    user: z.object({
      userId: z.string(),
      username: z.string().nullable().optional(), // <- longgar
      name: z.string().nullable().optional(), // <- longgar
      email: z.string().email().nullable().optional(),
      roles: z.array(z.object({
        id: z.string(),
        name: z.string(),
        tenantId: z.string().nullable().optional(),
        permissions: z.array(z.object({
          id: z.string(),
          name: z.string(),
        })).optional().default([]),
      })).optional().default([]),
    }),
    tenantCode: z.string().nullable().optional(),
    expiredAt: z.number().nullable().optional(),
    token: z.string(),
  }),
})
export type LoginCamel = z.infer<typeof LoginCamelDto>
