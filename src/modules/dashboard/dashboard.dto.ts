import z from 'zod';
import { NON_DAILY_UNITS } from '@/shared/types/domain.enums.js';

export const dashboardUpcomingRenewalsQueryParamsSchema = z.object({});

export const dashboardAlertsQueryParamsSchema = z.object({
	billingUnit: z.enum(NON_DAILY_UNITS).optional(),
});

export const upcomingRenewalsRequestSchema = z.object({
	query: dashboardUpcomingRenewalsQueryParamsSchema,
});

export const alertsRequestSchema = z.object({
	query: dashboardAlertsQueryParamsSchema,
});

export const safeDashboardUpcomingRenewalsSchema = z.object({
	category: z.string(),
	subscriptionName: z.string(),
	renewalDate: z.string(),
	amount: z.number().nonnegative('Amount must be a non-negative number'),
});

export const safeDashboardPaymentAlertsSchema = z.object({
	category: z.string(),
	subscriptionName: z.string(),
	dueDate: z.string(),
	amount: z.number().nonnegative('Amount must be a non-negative number'),
});

export type SafeUpcomingRenewalsDto = z.infer<
	typeof safeDashboardUpcomingRenewalsSchema
>;

export type SafePaymentAlertsDto = z.infer<
	typeof safeDashboardPaymentAlertsSchema
>;
export type SafePaidAlertsDto = SafePaymentAlertsDto;
