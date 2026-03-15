import { z } from 'zod';
import {
	BILLING_UNIT_VALUES,
	COST_TYPE_VALUES,
} from '@/shared/types/domain.enums.js';

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
	costType: z.enum(COST_TYPE_VALUES, {
		error: () =>
			`El tipo de costo debe ser uno de los siguientes: ${COST_TYPE_VALUES.join(', ')}`,
	}),
	billingFrequency: z.number().int().positive({
		error: 'La frecuencia de facturación debe ser un número positivo',
	}),
	billingUnit: z.enum(BILLING_UNIT_VALUES, {
		error: () =>
			`La unidad de facturación debe ser uno de los siguientes: ${BILLING_UNIT_VALUES.join(', ')}`,
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
		costType: z.enum(COST_TYPE_VALUES, {
			error: () =>
				`El tipo de costo debe ser uno de los siguientes: ${COST_TYPE_VALUES.join(', ')}`,
		}),
		billingFrequency: z.number().int().positive({
			error: 'La frecuencia de facturación debe ser un número positivo',
		}),
		billingUnit: z.enum(BILLING_UNIT_VALUES, {
			error: () =>
				`La unidad de facturación debe ser uno de los siguientes: ${BILLING_UNIT_VALUES.join(', ')}`,
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
	cost: z.number().nonnegative(),
	costType: z.enum(COST_TYPE_VALUES),
	billingFrequency: z.number().int().positive(),
	billingUnit: z.enum(BILLING_UNIT_VALUES),
	firstPaymentDate: z.date(),
	trialEndsOn: z.date().nullable().optional(),
});

export type SafeSubscriptionDto = z.infer<typeof safeSubscriptionSchema>;

// Infer the TypeScript types from the Zod schemas
export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
