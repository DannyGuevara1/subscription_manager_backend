import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import type DashboardController from '@/modules/dashboard/dashboard.controller.js';
import {
	upcomingRenewalsRequestSchema,
	alertsRequestSchema,
} from '@/modules/dashboard/dashboard.dto.js';
import { authorize } from '@/shared/middleware/authorize.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';

export const DASHBOARD_PATH = '/dashboard';

export default function dashboardRoutes(
	dashboardController: DashboardController,
): ExpressRouter {
	const router = Router();

	// GET /dashboard/summary
	router.get(
		'/summary',
		authorize('ADMIN', 'USER'),
		catchAsync(dashboardController.getSummary.bind(dashboardController)),
	);

	// GET /dashboard/upcoming-renewals
	router.get(
		'/upcoming-renewals',
		authorize('ADMIN', 'USER'),
		validateRequest(upcomingRenewalsRequestSchema),
		catchAsync(
			dashboardController.getUpcomingRenewals.bind(dashboardController),
		),
	);

	// GET /dashboard/alerts?billingUnit=MONTHS
	router.get(
		'/alerts',
		authorize('ADMIN', 'USER'),
		validateRequest(alertsRequestSchema),
		catchAsync(dashboardController.getPaymentAlerts.bind(dashboardController)),
	);

	return router;
}
