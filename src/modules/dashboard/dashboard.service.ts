import type { DashboardSummary } from '@/modules/dashboard/dashboard.type.js';
import type { SubscriptionService } from '@/modules/subscription/index.js';

export default class DashboardService {
	private subscriptionService: SubscriptionService;

	constructor(subscriptionService: SubscriptionService) {
		this.subscriptionService = subscriptionService;
	}

	/*
	 * Get summary of the dashboard
	 * debe retornar el total mensual y anual de las subscripciones activas del usuario autenticado
	 */
	async getSummary(userId: string): Promise<DashboardSummary> {
		const totalMonthly =
			await this.subscriptionService.getTotalMonthlySubscriptions(userId);
		const totalAnnual =
			await this.subscriptionService.getTotalAnnualSubscriptions(userId);

		return {
			totalMonthly,
			totalAnnual,
		};
	}
}
