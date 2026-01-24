// src/modules/auth/auth.dto.ts
import { z } from 'zod';

// Zod schema for login body
export const loginSchema = z.object({
	email: z.email({
		error: (issue) =>
			issue.input === undefined
				? 'El correo es obligatorio!'
				: 'El correo debe ser un correo electrónico válido',
	}),
	password: z.string({
		error: (issue) =>
			issue.input === undefined
				? 'La contraseña es obligatoria!'
				: 'El campo contraseña es invalido',
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
				? 'El correo es obligatorio!'
				: 'El correo debe ser un correo electrónico válido',
	}),
	password: z
		.string({
			error: (issue) =>
				issue.input === undefined
					? 'La contraseña es obligatoria!'
					: 'El campo contraseña es invalido',
		})
		.min(8, 'La contraseña debe tener al menos 8 caracteres'),
	name: z
		.string({
			error: (issue) =>
				issue.input === undefined
					? 'El nombre es obligatorio!'
					: 'El campo nombre es invalido',
		})
		.min(3, 'El nombre debe tener al menos 3 caracteres'),
	primaryCurrencyCode: z
		.string({
			error: (issue) =>
				issue.input === undefined
					? 'El código de moneda primaria es obligatorio!'
					: 'El campo código de moneda primaria es invalido',
		})
		.length(3, 'El código de moneda debe tener 3 caracteres')
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
	primaryCurrencyCode: z.string().length(3),
});

// Types inferred from body schemas
export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type SafeUserAuthDto = z.infer<typeof safeUserAuthDto>;
