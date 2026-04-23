import type { NextFunction, Request, Response } from 'express';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type DashboardService from '@/modules/dashboard/dashboard.service.js';

export default class DashboardController {
	private dashboardService: DashboardService;
	constructor(dashboardService: DashboardService) {
		this.dashboardService = dashboardService;
	}

	async getSummary(req: Request, res: Response, _next: NextFunction) {
		const userAuth = req.user as JWTPayload;
		const summary = await this.dashboardService.getSummary(userAuth);
		res.status(200).json({
			data: summary,
		});
	}
}
