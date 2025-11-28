// src/api/components/user/user.dto.ts
import { z } from 'zod';

export const createUserDto = z.object({
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

export const updateUserDto = createUserDto.partial();

// RESPONSE DTOs
export const safeUserDto = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable(),
	primaryCurrencyCode: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Types
export type SafeUserDto = z.infer<typeof safeUserDto>;
export type CreateUserDto = z.infer<typeof createUserDto>;
export type UpdateUserDto = z.infer<typeof updateUserDto>;
