import type { NextFunction, Request, Response } from 'express';
import DashboardService from '@/modules/dashboard/dashboard.service.js';

export default class DashboardController {
	private dashboardService: DashboardService;
	constructor(dashboardService: DashboardService) {
		this.dashboardService = dashboardService;
	}

	async getSummary(req: Request, res: Response, _next: NextFunction) {
		const userId = req.user?.sub as string;
		const summary = await this.dashboardService.getSummary(userId);
		res.status(200).json({
			data: summary,
		});
	}
}
