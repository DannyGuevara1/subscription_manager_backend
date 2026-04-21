import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { authorize } from '@/shared/middleware/authorize.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
import DashboardController from '@/modules/dashboard/dashboard.controller.js';

export const DASHBOARD_PATH = '/dashboard';

export default function dashboardRoutes(
	dashboardController: DashboardController,
): ExpressRouter {
	const router = Router();

	// GET
	router.get(
		'/summary',
		authorize('ADMIN', 'USER'),
		catchAsync(dashboardController.getSummary.bind(dashboardController)),
	);

	return router;
}
