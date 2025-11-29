import { z } from 'zod';

export const createCurrencySchema = z.object({
	code: z.string().length(3, 'El Código debe tener 3 caracteres').toUpperCase(),
	name: z
		.string()
		.min(3, 'El nombre es requerido')
		.max(100, 'El nombre es muy grande'),
	symbol: z
		.string()
		.min(1, 'El simbolo es requerido')
		.max(10, 'El simbolo es muy grande'),
});

export const updateCurrencySchema = createCurrencySchema.partial();
export const currencyCodeSchema = z.object({
	code: z.string().length(3).toUpperCase(),
});
