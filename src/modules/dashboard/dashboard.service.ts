import type { JWTPayload } from '@/modules/auth/auth.type.js';
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
	async getSummary(userAuth: JWTPayload): Promise<DashboardSummary> {
		const userId = userAuth.sub;
		const totalMonthly =
			await this.subscriptionService.getTotalMonthlySubscriptions(userId);
		const totalAnnual =
			await this.subscriptionService.getTotalAnnualSubscriptions(userId);
		const totalDaily =
			await this.subscriptionService.getTotalDailySubscriptions(userId);
		const totalWeekly =
			await this.subscriptionService.getTotalWeeklySubscriptions(userId);
		const expensesByType = {
			DAYS: totalDaily,
			WEEKS: totalWeekly,
			MONTHS: totalMonthly,
			YEARS: totalAnnual,
		};

		return {
			totalMonthly,
			totalAnnual,
			currentAnnual: '0.00',
			currentMonthly: '0.00',
			projectedMonthly: '0.00',
			projectedAnnual: '0.00',
			expensesByType,
			currencyCode: userAuth.primaryCurrencyCode || 'USD',
		};
	}
}
