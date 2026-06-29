import type { NextFunction, Request, Response } from 'express';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type DashboardService from '@/modules/dashboard/dashboard.service.js';
import {
	safeDashboardUpcomingRenewalsSchema,
	safeDashboardPaymentAlertsSchema,
} from '@/modules/dashboard/dashboard.dto.js';
import type {
	SafeUpcomingRenewalsDto,
	SafePaymentAlertsDto,
} from '@/modules/dashboard/dashboard.dto.js';

/**
 * Handles HTTP requests for dashboard endpoints.
 * All methods require authentication via JWTPayload.
 */
export default class DashboardController {
	private dashboardService: DashboardService;
	constructor(dashboardService: DashboardService) {
		this.dashboardService = dashboardService;
	}

	/**
	 * GET /dashboard/summary
	 * Returns monthly and annual totals for the authenticated user's active subscriptions.
	 */
	async getSummary(req: Request, res: Response, _next: NextFunction) {
		const userAuth = req.user as JWTPayload;
		const summary = await this.dashboardService.getSummary(userAuth);
		res.status(200).json({
			data: summary,
		});
	}

	/**
	 * GET /dashboard/upcoming-renewals
	 * Returns up to 5 closest upcoming renewals, prioritizing trials ending soon.
	 */
	async getUpcomingRenewals(
		req: Request,
		res: Response,
		_next: NextFunction,
	) {
		const userAuth = req.user as JWTPayload;
		const renewals =
			await this.dashboardService.getUpcomingRenewals(userAuth);

		const serialized: SafeUpcomingRenewalsDto[] = renewals.map((renewal) =>
			safeDashboardUpcomingRenewalsSchema.parse(renewal),
		);

		res.status(200).json({
			data: serialized,
		});
	}

	/**
	 * GET /dashboard/alerts
	 * Returns subscriptions with payments due within the next 7 days.
	 */
	async getPaymentAlerts(req: Request, res: Response, _next: NextFunction) {
		const userAuth = req.user as JWTPayload;
		const alerts = await this.dashboardService.getPaymentAlerts(userAuth);

		const serialized: SafePaymentAlertsDto[] = alerts.map((alert) =>
			safeDashboardPaymentAlertsSchema.parse(alert),
		);

		res.status(200).json({
			data: serialized,
		});
	}
}

