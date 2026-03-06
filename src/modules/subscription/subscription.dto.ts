import { BillingUnit, CostType } from '@prisma/client';
import { z } from 'zod';

export const subscriptionParamsSchema = z.object({
	id: z.uuidv7({ error: 'El ID de suscripción debe ser un UUID válido' }),
});

export const createSubscriptionSchema = z.object({
	categoryId: z
		.number()
		.int()
		.positive({ error: 'El ID de categoría debe ser valido' }),
	currencyCode: z
		.string()
		.length(3, { error: 'El código de moneda debe tener 3 caracteres' }),
	name: z
		.string()
		.min(1, { error: 'El nombre es obligatorio' })
		.max(100, { error: 'El nombre no puede superar los 100 caracteres' }),
	cost: z
		.number()
		.nonnegative({ error: 'El costo debe ser un número positivo' }),
	costType: z.enum(Object.values(CostType), {
		error: () =>
			`El tipo de costo debe ser uno de los siguientes: ${Object.values(CostType).join(', ')}`,
	}),
	billingFrequency: z.number().int().positive({
		error: 'La frecuencia de facturación debe ser un número positivo',
	}),
	billingUnit: z.enum(Object.values(BillingUnit), {
		error: () =>
			`La unidad de facturación debe ser uno de los siguientes: ${Object.values(BillingUnit).join(', ')}`,
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
		name: z
			.string()
			.min(1, { error: 'El nombre es obligatorio' })
			.max(100, { error: 'El nombre no puede superar los 100 caracteres' }),
		cost: z
			.number()
			.nonnegative({ error: 'El costo debe ser un número positivo' }),
		costType: z.enum(Object.values(CostType), {
			error: () =>
				`El tipo de costo debe ser uno de los siguientes: ${Object.values(CostType).join(', ')}`,
		}),
		billingFrequency: z.number().int().positive({
			error: 'La frecuencia de facturación debe ser un número positivo',
		}),
		billingUnit: z.enum(Object.values(BillingUnit), {
			error: () =>
				`La unidad de facturación debe ser uno de los siguientes: ${Object.values(BillingUnit).join(', ')}`,
		}),
		firstPaymentDate: z.coerce.date(),
		trialEndsOn: z.coerce.date().optional(),
	})
	.partial();

// Request Schema
export const createSubscriptionRequestSchema = z.object({
	body: createSubscriptionSchema,
});

export const updateSubscriptionRequestSchema = z.object({
	body: updateSubscriptionSchema,
	params: subscriptionParamsSchema,
});

export const subscriptionParamsRequestSchema = z.object({
	params: subscriptionParamsSchema,
});
//RESPONSE DTOs
export const safeSubscriptionSchema = z.object({
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

export type SafeSubscriptionDto = z.infer<typeof safeSubscriptionSchema>;

// Infer the TypeScript types from the Zod schemas
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
