import { z } from 'zod';

// SCHEMAS
export const currencyParamsSchema = z.object({
	code: z.string().length(3, 'Code must be 3 characters long').toUpperCase(),
});

export const createCurrencySchema = z.object({
	code: z
		.string({
			error: (iss) =>
				iss.input === undefined
					? 'Field is required.'
					: 'Field must be a string.',
		})
		.length(3, 'Code must be 3 characters long')
		.toUpperCase(),
	name: z.string().min(3, 'Name is too short').max(100, 'Name is too long'),

	symbol: z
		.string({
			error: (iss) =>
				iss.input === undefined
					? 'Field is required.'
					: 'Field must be a string.',
		})
		.min(1, 'Symbol must have at least 1 character')
		.max(10, 'Symbol is too long'),
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
