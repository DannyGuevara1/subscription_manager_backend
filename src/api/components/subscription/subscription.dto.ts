import { BillingUnit, CostType } from '@prisma/client';
import { z } from 'zod';

export const createSubscriptionSchema = z.object({
	userId: z.uuidv7({ error: 'El ID de usuario debe ser un UUID válido' }),
	categoryId: z
		.number()
		.int()
		.positive({ error: 'El ID de categoría debe ser valido' }),
	currencyCode: z
		.string()
		.length(3, { error: 'El código de moneda debe tener 3 caracteres' }),
	name: z.string().min(1, { error: 'El nombre es obligatorio' }),
	cost: z
		.number()
		.nonnegative({ error: 'El costo debe ser un número positivo' }),
	costType: z.enum(Object.values(CostType), {
		error: () =>
			'El tipo de costo debe ser uno de los siguientes: FIXDED, VARIABLE',
	}),
	billingFrequency: z.number().int().positive({
		error: 'La frecuencia de facturación debe ser un número positivo',
	}),
	billingUnit: z.enum(Object.values(BillingUnit), {
		error: () =>
			'La unidad de facturación debe ser uno de los siguientes: DAYS, WEEKS, MONTHS, YEARS',
	}),
	firstPaymentDate: z.coerce.date(),
	trialEndsOn: z.coerce.date().optional(),
});

export const updateSubscriptionSchema = z
	.object({
		categoryId: z
			.number()
			.int()
			.positive({ error: 'El ID de categoría debe ser valido' }),
		currencyCode: z
			.string()
			.length(3, { error: 'El código de moneda debe tener 3 caracteres' }),
		name: z.string().min(1, { error: 'El nombre es obligatorio' }),
		cost: z
			.number()
			.nonnegative({ error: 'El costo debe ser un número positivo' }),
		costType: z.enum(Object.values(CostType), {
			error: () =>
				'El tipo de costo debe ser uno de los siguientes: fijo, variable',
		}),
		billingFrequency: z.number().int().positive({
			error: 'La frecuencia de facturación debe ser un número positivo',
		}),
		billingUnit: z.enum(Object.values(BillingUnit), {
			error: () =>
				'La unidad de facturación debe ser uno de los siguientes: días, semanas, meses, años',
		}),
		firstPaymentDate: z.coerce.date(),
		trialEndsOn: z.coerce.date().optional(),
	})
	.partial();

//RESPONSE DTOs
export const safeSubscriptionDto = z.object({
	id: z.uuidv7(),
	userId: z.uuidv7(),
	categoryId: z.number(),
	currencyCode: z.string(),
	name: z.string(),
	cost: z.number(),
	costType: z.enum(Object.values(CostType)),
	billingFrequency: z.number(),
	billingUnit: z.enum(Object.values(BillingUnit)),
	firstPaymentDate: z.date(),
	trialEndsOn: z.date().nullable().optional(),
});

// Infer the TypeScript types from the Zod schemas
export type SafeSubscriptionDto = z.infer<typeof safeSubscriptionDto>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
