import type { DashboardSummary } from '@/modules/dashboard/dashboard.type.js';
import type { SubscriptionService } from '@/modules/subscription/index.js';
import type { UserService } from '@/modules/user/index.js';
export default class DashboardService {
	private userService: UserService;
	private subscriptionService: SubscriptionService;

	constructor(
		userService: UserService,
		subscriptionService: SubscriptionService,
	) {
		this.userService = userService;
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
