import { z } from 'zod'

/**
 * Schema untuk create role form
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .min(3, 'Role name must be at least 3 characters')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[\w\s\-]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
})

/**
 * Schema untuk update role form
 */
export const updateRoleSchema = createRoleSchema.partial()

/**
 * Schema untuk role permissions form
 */
export const rolePermissionSchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
})

// Export types
export type CreateRoleFormData = z.infer<typeof createRoleSchema>
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>
export type RolePermissionFormData = z.infer<typeof rolePermissionSchema>
