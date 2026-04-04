// src/modules/auth/auth.dto.ts

import { z } from 'zod';
import { ROLE_VALUES } from '@/shared/types/domain.enums.js';
// Zod schema for login body
export const loginSchema = z.object({
	email: z.email({
		error: (issue) =>
			issue.input === undefined
				? 'Email is required!'
				: 'Email must be a valid email address',
	}),
	password: z.string({
		error: (issue) =>
			issue.input === undefined
				? 'Password is required!'
				: 'Password field is invalid',
	}),
});

// Zod schema for full login request (body/query/params)
export const loginRequestSchema = z.object({
	body: loginSchema,
});

// Zod schema for register body
export const registerSchema = z.object({
	email: z.email({
		error: (issue) =>
			issue.input === undefined
				? 'Email is required!'
				: 'Email must be a valid email address',
	}),
	password: z
		.string({
			error: (issue) =>
				issue.input === undefined
					? 'Password is required!'
					: 'Password field is invalid',
		})
		.min(8, 'Password must be at least 8 characters long'),
	name: z
		.string({
			error: (issue) =>
				issue.input === undefined
					? 'Name is required!'
					: 'Name field is invalid',
		})
		.min(3, 'Name must be at least 3 characters long'),
	primaryCurrencyCode: z
		.string()
		.length(3, 'Currency code must be 3 characters long')
		.uppercase('Currency code must be uppercase')
		.optional(),
});

// Zod schema for full register request (body/query/params)
export const registerRequestSchema = z.object({
	body: registerSchema,
});

//DTO
export const safeUserAuthDto = z.object({
	id: z.uuidv7(),
	name: z.string().nullable(),
	email: z.email(),
	primaryCurrencyCode: z
		.string()
		.length(3, 'Currency code must be 3 characters long')
		.uppercase('Currency code must be uppercase'),
	role: z.enum(ROLE_VALUES),
});

export const jwtPayloadSchema = z
	.object({
		sub: z.uuidv7({ error: 'Token subject must be a valid UUIDv7' }),
		email: z.email('Token email must be a valid email address'),
		name: z.string().nullable(),
		role: z.enum(ROLE_VALUES),
		primaryCurrencyCode: z
			.string()
			.length(3, 'Currency code must be 3 characters long')
			.uppercase('Currency code must be uppercase')
			.optional(),
		iat: z.number().int().optional(),
		exp: z.number().int().optional(),
	})
	.strict();

export const refreshTokenPayloadSchema = z
	.object({
		sub: z.uuidv7({ error: 'Token subject must be a valid UUIDv7' }),
		jti: z.uuid({ error: 'Token jti must be a valid UUID' }),
		iat: z.number().int().optional(),
		exp: z.number().int().optional(),
	})
	.strict();

// Types inferred from body schemas
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type SafeUserAuthDto = z.infer<typeof safeUserAuthDto>;
export type JwtPayloadDto = z.infer<typeof jwtPayloadSchema>;
export type RefreshTokenPayloadDto = z.infer<typeof refreshTokenPayloadSchema>;
