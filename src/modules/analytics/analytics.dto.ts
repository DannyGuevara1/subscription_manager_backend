import z from 'zod';
import { NON_DAILY_UNITS } from '@/shared/types/domain.enums.js';

export const expensesByCategoryQueryParamsSchema = z.object({
	status: z.coerce.boolean().optional(),
	billingUnit: z.enum(NON_DAILY_UNITS).optional(),
});

export const paymentHistoryQueryParamsSchema =
	expensesByCategoryQueryParamsSchema;

export const expensesByCategoryRequestSchema = z.object({
	query: expensesByCategoryQueryParamsSchema,
});

export const paymentHistoryRequestSchema = z.object({
	query: paymentHistoryQueryParamsSchema,
});

export const safePaymentHistorySchema = z.object({
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
export type SafePaymentHistoryDto = z.infer<typeof safePaymentHistorySchema>;
