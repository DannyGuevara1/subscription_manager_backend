import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import {
	expensesByCategoryRequestSchema,
	paymentTimelineRequestSchema,
} from '@/modules/analytics/analytics.dto.js';
import type AnalyticsController from '@/modules/analytics/analytics.controller.js';
import { authorize } from '@/shared/middleware/authorize.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';

export const ANALYTICS_PATH = '/analytics';

export default function analyticsRoutes(
	analyticsController: AnalyticsController,
): ExpressRouter {
	const router = Router();

	// GET /analytics/expenses-by-category?status=true&billingUnit=MONTHS
	router.get(
		'/expenses-by-category',
		authorize('ADMIN', 'USER'),
		validateRequest(expensesByCategoryRequestSchema),
		catchAsync(
			analyticsController.getExpensesByCategory.bind(analyticsController),
		),
	);

	// GET /analytics/payment-timeline?status=true&billingUnit=MONTHS
	router.get(
		'/payment-timeline',
		authorize('ADMIN', 'USER'),
		validateRequest(paymentTimelineRequestSchema),
		catchAsync(
			analyticsController.getPaymentTimeline.bind(analyticsController),
		),
	);

	return router;
}
