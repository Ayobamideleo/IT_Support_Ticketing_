import { z } from 'zod';

// Validation schema for creating a user
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['employee', 'it_staff', 'manager']).optional().default('employee'),
  department: z.string().max(50).optional().nullable()
});

// Validation schema for updating user role
export const updateRoleSchema = z.object({
  role: z.enum(['employee', 'it_staff', 'manager'], {
    errorMap: () => ({ message: 'Role must be employee, it_staff, or manager' })
  })
});

// Validation schema for updating user status
export const updateStatusSchema = z.object({
  isVerified: z.boolean({
    errorMap: () => ({ message: 'isVerified must be a boolean' })
  })
});

// Validation schema for user query filters
export const userQuerySchema = z.object({
  page: z.union([z.string().regex(/^\d+$/), z.number()]).optional().default('1').transform((v) => v.toString()),
  limit: z.union([z.string().regex(/^\d+$/), z.number()]).optional().default('20').transform((v) => v.toString()),
  role: z
    .union([z.enum(['employee', 'it_staff', 'manager']), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  status: z
    .union([z.enum(['active', 'inactive']), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  department: z
    .union([z.string().max(50), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  q: z
    .union([z.string().max(100), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v))
});

// Validation schema for updating basic user profile fields (currently department only)
export const updateDepartmentSchema = z.object({
  department: z
    .union([z.string().max(50), z.null()])
    .optional()
});
