// src/modules/user/user.dto.ts
import { z } from 'zod';
import { ROLE_VALUES } from '@/shared/types/domain.enums.js';

// Schema for the validation Params
export const userParamsSchema = z.object({
	id: z.uuidv7({ error: 'User ID must be a valid UUID' }),
});

// Schema Definitions for User DTOs
export const createUserSchema = z.object({
	email: z.email('Invalid email address').toLowerCase(),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters long')
		.max(100, 'Password must be 100 characters or less'),
	name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
	primaryCurrencyCode: z
		.string()
		.length(3, 'Currency code must be 3 characters long'),
});

export const updateUserSchema = createUserSchema.partial();

export const updateUserRoleSchema = z.object({
	role: z.enum(ROLE_VALUES),
});

export const createUserRequestSchema = z.object({
	body: createUserSchema,
});

export const updateUserRequestSchema = z.object({
	body: updateUserSchema,
	params: userParamsSchema,
});

export const updateUserRoleRequestSchema = z.object({
	body: updateUserRoleSchema,
	params: userParamsSchema,
});

export const userParamsRequestSchema = z.object({
	params: userParamsSchema,
});
// RESPONSE DTOs
// Contrato completo → ADMIN y USER (owner)
export const safeUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable(),
	primaryCurrencyCode: z.string(),
	role: z.enum(ROLE_VALUES),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type SafeUserDto = z.infer<typeof safeUserSchema>;

// Contrato restringido → SUPPORT
export const supportUserSchema = z.object({
	id: z.string(),
	primaryCurrencyCode: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
}).strict();

export type SupportUserDto = z.infer<typeof supportUserSchema>;

export type ProfileDto = SafeUserDto | SupportUserDto;

// Types Inferred from Schemas
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;
