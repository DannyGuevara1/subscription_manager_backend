import { Temporal } from 'temporal-polyfill';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type {
	DashboardPaymentAlert,
	DashboardSummary,
	DashboardUpcomingRenewal,
} from '@/modules/dashboard/dashboard.type.js';
import type SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import type SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type { SubscriptionService } from '@/modules/subscription/index.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';

const UPCOMING_RENEWALS_LIMIT = 5;
const ALERT_WINDOW_DAYS = 7;

export default class DashboardService {
	private subscriptionService: SubscriptionService;
	private subscriptionCostNormalizerService: SubscriptionCostNormalizerService;
	private subscriptionCalculatorService: SubscriptionCalculatorService;
	private categoryService: CategoryService;

	constructor(
		subscriptionService: SubscriptionService,
		subscriptionCostNormalizerService: SubscriptionCostNormalizerService,
		subscriptionCalculatorService: SubscriptionCalculatorService,
		categoryService: CategoryService,
	) {
		this.subscriptionService = subscriptionService;
		this.subscriptionCostNormalizerService = subscriptionCostNormalizerService;
		this.subscriptionCalculatorService = subscriptionCalculatorService;
		this.categoryService = categoryService;
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

	/*
	 * Returns up to 5 closest upcoming renewals.
	 * Prioritizes subscriptions with ending trials over regular renewals.
	 */
	async getUpcomingRenewals(
		userAuth: JWTPayload,
	): Promise<DashboardUpcomingRenewal[]> {
		const userId = userAuth.sub;
		const subscriptions =
			await this.subscriptionService.getActiveSubscriptions(userId);

		const now = new Date();

		const renewals: (DashboardUpcomingRenewal & {
			isTrialEnding: boolean;
			sortDate: Date;
		})[] = [];

		// Batch fetch categories
		const categoryIds = subscriptions.map((sub) => sub.categoryId);
		const categoryMap = await this.categoryService.getCategoriesByIds(
			categoryIds,
			userId,
		);

		for (const sub of subscriptions) {
			const nextDate = this.subscriptionCalculatorService.nextPaymentDate({
				firstPaymentDate: sub.firstPaymentDate,
				billingFrequency: sub.billingFrequency,
				billingUnit: sub.billingUnit,
				trialEndsOn: sub.trialEndsOn,
			});

			const categoryName = categoryMap.get(sub.categoryId) ?? 'Unknown';

			const isTrialEnding = this.isTrialEndingSoon(sub, now);

			renewals.push({
				category: categoryName,
				subscriptionName: sub.name,
				renewalDate: nextDate.toISOString(),
				amount: sub.cost,
				isTrialEnding,
				sortDate: nextDate,
			});
		}

		// Sort: trials first, then by closest date
		renewals.sort((a, b) => {
			if (a.isTrialEnding !== b.isTrialEnding) {
				return a.isTrialEnding ? -1 : 1;
			}
			return a.sortDate.getTime() - b.sortDate.getTime();
		});

		// Return top 5, stripped of internal sort fields
		return renewals
			.slice(0, UPCOMING_RENEWALS_LIMIT)
			.map(({ isTrialEnding, sortDate, ...renewal }) => renewal);
	}

	/*
	 * Returns all subscriptions with payments due within the next 7 days.
	 */
	async getPaymentAlerts(
		userAuth: JWTPayload,
	): Promise<DashboardPaymentAlert[]> {
		const userId = userAuth.sub;
		const subscriptions =
			await this.subscriptionService.getActiveSubscriptions(userId);

		const now = Temporal.Now.zonedDateTimeISO('UTC');
		const alertWindow = new Date(
			now.add({ days: ALERT_WINDOW_DAYS }).toInstant().epochMilliseconds,
		);

		const alerts: DashboardPaymentAlert[] = [];

		// Batch fetch categories
		const categoryIds = subscriptions.map((sub) => sub.categoryId);
		const categoryMap = await this.categoryService.getCategoriesByIds(
			categoryIds,
			userId,
		);

		for (const sub of subscriptions) {
			const nextDate = this.subscriptionCalculatorService.nextPaymentDate({
				firstPaymentDate: sub.firstPaymentDate,
				billingFrequency: sub.billingFrequency,
				billingUnit: sub.billingUnit,
				trialEndsOn: sub.trialEndsOn,
			});

			if (nextDate <= alertWindow) {
				const categoryName = categoryMap.get(sub.categoryId) ?? 'Unknown';

				alerts.push({
					category: categoryName,
					subscriptionName: sub.name,
					dueDate: nextDate.toISOString(),
					amount: sub.cost,
				});
			}
		}

		// Sort by closest due date
		alerts.sort(
			(a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
		);

		return alerts;
	}

	private isTrialEndingSoon(sub: SubscriptionDomain, now: Date): boolean {
		if (!sub.trialEndsOn) return false;
		return sub.trialEndsOn > now;
	}
}
