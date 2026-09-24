import z from 'zod';
import {
	NON_DAILY_UNITS,
	STATUS_SUBSCRIPTION_VALUES,
} from '@/shared/types/domain.enums.js';

export const expensesByCategoryQueryParamsSchema = z.object({
	status: z.preprocess((val) => {
		if (val === 'true' || val === true) return 'ACTIVE';
		if (val === 'false' || val === false) return 'PAUSED';
		return val;
	}, z.enum(STATUS_SUBSCRIPTION_VALUES).optional()),
	billingUnit: z.enum(NON_DAILY_UNITS).optional(),
});

export const paymentTimelineQueryParamsSchema =
	expensesByCategoryQueryParamsSchema;

export const expensesByCategoryRequestSchema = z.object({
	query: expensesByCategoryQueryParamsSchema,
});

export const paymentTimelineRequestSchema = z.object({
	query: paymentTimelineQueryParamsSchema,
});

export const safePaymentTimelineEntrySchema = z.object({
	subscriptionName: z.string(),
	category: z.string(),
	amount: z.number(),
	currency: z.string(),
	date: z.string(), // ISO string
});

export const safeExpensesByCategorySchema = z.object({
	currency: z.string(),
	totalExpenses: z.number(),
	breakdown: z.array(
		z.object({
			category: z.string(),
			amount: z.number(),
			percentage: z.number(),
		}),
	),
});

export type SafeExpensesByCategoryDto = z.infer<
	typeof safeExpensesByCategorySchema
>;
export type SafePaymentTimelineEntryDto = z.infer<
	typeof safePaymentTimelineEntrySchema
>;
