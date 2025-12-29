import { z } from 'zod';

// SCHEMAS
export const currencyParamsSchema = z.object({
	code: z.string().length(3, 'El Código debe tener 3 caracteres').toUpperCase(),
});

export const createCurrencySchema = z.object({
	code: z
		.string({
			error: (iss) =>
				iss.input === undefined
					? 'El campo es requerido.'
					: 'El campo debe ser una cadena de texto.',
		})
		.length(3, 'El Código debe tener 3 caracteres')
		.toUpperCase(),
	name: z
		.string()
		.min(3, 'El nombre es muy corto')
		.max(100, 'El nombre es muy grande'),

	symbol: z
		.string({
			error: (iss) =>
				iss.input === undefined
					? 'El campo es requerido.'
					: 'El campo debe ser una cadena de texto.',
		})
		.min(1, 'Debe tener al menos un caracter como simbolo')
		.max(10, 'El simbolo es muy grande'),
});

export const updateCurrencySchema = createCurrencySchema
	.omit({ code: true })
	.partial();

// REQUEST SCHEMAS
export const createCurrencyRequestSchema = z.object({
	body: createCurrencySchema,
});

export const updateCurrencyRequestSchema = z.object({
	params: currencyParamsSchema,
	body: updateCurrencySchema,
});

export const currencyParamsRequestSchema = z.object({
	params: currencyParamsSchema,
});

//DTO Safe Currency
export const safeCurrencySchema = z.object({
	code: z.string().length(3),
	name: z.string(),
	symbol: z.string(),
});

export type SafeCurrencyDto = z.infer<typeof safeCurrencySchema>;

// Infer the TypeScript types from the Zod schemas
export type CreateCurrencyDto = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyDto = z.infer<typeof updateCurrencySchema>;
