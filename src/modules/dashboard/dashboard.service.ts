import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type { DashboardSummary } from '@/modules/dashboard/dashboard.type.js';
import type SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import type { SubscriptionService } from '@/modules/subscription/index.js';

export default class DashboardService {
	private subscriptionService: SubscriptionService;
	private subscriptionCostNormalizerService: SubscriptionCostNormalizerService;

	constructor(
		subscriptionService: SubscriptionService,
		subscriptionCostNormalizerService: SubscriptionCostNormalizerService,
	) {
		this.subscriptionService = subscriptionService;
		this.subscriptionCostNormalizerService = subscriptionCostNormalizerService;
	}

	/*
	 * Get summary of the dashboard
	 * debe retornar el total mensual y anual de las subscripciones activas del usuario autenticado
	 */
	async getSummary(userAuth: JWTPayload): Promise<DashboardSummary> {
		const userId = userAuth.sub;
		const subscriptions =
			await this.subscriptionService.getActiveSubscriptions(userId);
		return await this.subscriptionCostNormalizerService.normalizeAll(
			subscriptions,
			userAuth.primaryCurrencyCode,
		);
	}
}
