// src/api/features/auth/dto/auth.dto.ts
import { z } from 'zod';

export const loginSchema = z.object({
	body: z.object({
		email: z.email('El correo no es válido'),
		password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
	}),
});

export const registerSchema = z.object({
	email: z.email('El correo no es válido'),
	password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
	name: z
		.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres')
		.optional(),
});

//DTO Response
export const safeLoginDto = z.object({
	id: z.string(),
	email: z.string(),
	name: z.string().nullable(),
	primaryCurrencyCode: z.string(),
});

//Important Types
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type SafeLoginDto = z.infer<typeof safeLoginDto>;
