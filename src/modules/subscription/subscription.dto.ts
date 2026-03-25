import { z } from 'zod';
import {
	BILLING_UNIT_VALUES,
	COST_TYPE_VALUES,
} from '@/shared/types/domain.enums.js';

export const subscriptionParamsSchema = z.object({
	id: z.uuidv7({ error: 'Subscription ID must be a valid UUID' }),
});

export const subscriptionCursorPaginationQuerySchema = z.object({
	cursor: z.uuidv7({ error: 'Cursor must be a valid UUIDv7' }).optional(),
	limit: z.coerce
		.number()
		.int({ error: 'Limit must be an integer' })
		.min(1, { error: 'Limit must be at least 1' })
		.max(100, { error: 'Limit must be at most 100' })
		.default(10),
});

export const createSubscriptionSchema = z.object({
	categoryId: z.number().int().positive({ error: 'Category ID must be valid' }),
	currencyCode: z
		.string()
		.length(3, { error: 'Currency code must be 3 characters long' }),
	name: z
		.string()
		.min(1, { error: 'Name is required' })
		.max(100, { error: 'Name must be at most 100 characters long' }),
	cost: z.number().nonnegative({ error: 'Cost must be a positive number' }),
	costType: z.enum(COST_TYPE_VALUES, {
		error: () => `Cost type must be one of: ${COST_TYPE_VALUES.join(', ')}`,
	}),
	billingFrequency: z.number().int().positive({
		error: 'Billing frequency must be a positive number',
	}),
	billingUnit: z.enum(BILLING_UNIT_VALUES, {
		error: () =>
			`Billing unit must be one of: ${BILLING_UNIT_VALUES.join(', ')}`,
	}),
	firstPaymentDate: z.coerce.date(),
	trialEndsOn: z.coerce.date().optional(),
});

export const updateSubscriptionSchema = z
	.object({
		categoryId: z
			.number()
			.int()
			.positive({ error: 'Category ID must be valid' }),
		currencyCode: z
			.string()
			.length(3, { error: 'Currency code must be 3 characters long' }),
		name: z
			.string()
			.min(1, { error: 'Name is required' })
			.max(100, { error: 'Name must be at most 100 characters long' }),
		cost: z.number().nonnegative({ error: 'Cost must be a positive number' }),
		costType: z.enum(COST_TYPE_VALUES, {
			error: () => `Cost type must be one of: ${COST_TYPE_VALUES.join(', ')}`,
		}),
		billingFrequency: z.number().int().positive({
			error: 'Billing frequency must be a positive number',
		}),
		billingUnit: z.enum(BILLING_UNIT_VALUES, {
			error: () =>
				`Billing unit must be one of: ${BILLING_UNIT_VALUES.join(', ')}`,
		}),
		firstPaymentDate: z.coerce.date(),
		trialEndsOn: z.coerce.date().optional(),
	})
	.partial();

// Request Schema
export const createSubscriptionRequestSchema = z.object({
	body: createSubscriptionSchema,
});

export const subscriptionCursorPaginationRequestSchema = z.object({
	query: subscriptionCursorPaginationQuerySchema,
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
export type SubscriptionCursorPaginationQueryDto = z.infer<
	typeof subscriptionCursorPaginationQuerySchema
>;
