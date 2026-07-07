import { Temporal } from 'temporal-polyfill';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';
import type {
	ExpensesByCategory,
	ExpensesByCategoryQuery,
	PaymentTimelineEntry,
} from '@/modules/analytics/analytics.type.js';

/**
 * Provides analytics aggregations for subscription expenses and payment projections.
 * Handles cross-currency normalization and chronological ordering.
 */
export default class AnalyticsService {
	private subscriptionService: SubscriptionService;
	private exchangeRateService: ExchangeRateService;
	private subscriptionCalculatorService: SubscriptionCalculatorService;
	private categoryService: CategoryService;

	constructor(
		subscriptionService: SubscriptionService,
		exchangeRateService: ExchangeRateService,
		subscriptionCalculatorService: SubscriptionCalculatorService,
		categoryService: CategoryService,
	) {
		this.subscriptionService = subscriptionService;
		this.exchangeRateService = exchangeRateService;
		this.subscriptionCalculatorService = subscriptionCalculatorService;
		this.categoryService = categoryService;
	}

	/**
	 * Aggregates total expenses by category, normalized to the user's primary currency.
	 * Uses two-step conversion: source currency → USD → primary currency.
	 */
	async getExpensesByCategory(
		userAuth: JWTPayload,
		query: ExpensesByCategoryQuery,
	): Promise<ExpensesByCategory> {
		const userId = userAuth.sub;
		const primaryCurrency = userAuth.primaryCurrencyCode;

		const subscriptions =
			await this.subscriptionService.getActiveSubscriptions(userId);

		const filtered = this.applyFilters(subscriptions, query);

		// Rate del currency primario del usuario (para convertir de USD → primary)
		const primaryRate =
			await this.exchangeRateService.getRateToUSD(primaryCurrency);

		// Aggregate expenses by category, normalizing to user's primary currency
		const categoryTotals = new Map<string, number>();

		// Batch fetch categories to avoid N+1 queries
		const categoryIds = filtered.map((sub) => sub.categoryId);
		const categoryMap = await this.categoryService.getCategoriesByIds(
			categoryIds,
			userId,
		);

		for (const sub of filtered) {
			const sourceRate = await this.exchangeRateService.getRateToUSD(
				sub.currencyCode,
			);
			// Two-step: source → USD → primary
			const costInPrimary = (Number(sub.cost) * sourceRate) / primaryRate;

			const categoryName = categoryMap.get(sub.categoryId) ?? 'Unknown';

			const current = categoryTotals.get(categoryName) ?? 0;
			categoryTotals.set(categoryName, current + costInPrimary);
		}

		const totalExpenses = [...categoryTotals.values()].reduce(
			(sum, amount) => sum + amount,
			0,
		);

		const breakdown = [...categoryTotals.entries()].map(
			([category, amount]) => ({
				category,
				amount: Number(amount.toFixed(2)),
				percentage:
					totalExpenses > 0
						? Number(((amount / totalExpenses) * 100).toFixed(2))
						: 0,
			}),
		);

		return {
			currency: primaryCurrency,
			totalExpenses: Number(totalExpenses.toFixed(2)),
			breakdown,
		};
	}

	/**
	 * Returns a chronological payment timeline from each subscription's
	 * firstPaymentDate up to one year from now. Includes past and future
	 * payments. Uses SubscriptionCalculatorService to compute payment dates.
	 */
	async getPaymentTimeline(
		userAuth: JWTPayload,
		query: ExpensesByCategoryQuery,
	): Promise<PaymentTimelineEntry[]> {
		const userId = userAuth.sub;
		const subscriptions =
			await this.subscriptionService.getActiveSubscriptions(userId);

		const filtered = this.applyFilters(subscriptions, query);

		const now = Temporal.Now.zonedDateTimeISO('UTC');
		const endDate = new Date(
			now.add({ years: 1 }).toInstant().epochMilliseconds,
		);

		const timeline: PaymentTimelineEntry[] = [];

		// Batch fetch categories to avoid N+1 queries
		const categoryIds = filtered.map((sub) => sub.categoryId);
		const categoryMap = await this.categoryService.getCategoriesByIds(
			categoryIds,
			userId,
		);

		for (const sub of filtered) {
			const categoryName = categoryMap.get(sub.categoryId) ?? 'Unknown';

			const paymentDates =
				this.subscriptionCalculatorService.projectNextPaymentDates({
					firstPaymentDate: sub.firstPaymentDate,
					billingFrequency: sub.billingFrequency,
					billingUnit: sub.billingUnit,
					trialEndsOn: sub.trialEndsOn,
					endDate,
				});

			for (const date of paymentDates) {
				timeline.push({
					subscriptionName: sub.name,
					category: categoryName,
					amount: Number(sub.cost),
					currency: sub.currencyCode,
					date: date.toISOString(),
				});
			}
		}

		// Chronological ordering
		timeline.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		return timeline;
	}

	private applyFilters(
		subscriptions: SubscriptionDomain[],
		query: ExpensesByCategoryQuery,
	): SubscriptionDomain[] {
		let filtered = subscriptions;

		if (query.status !== undefined) {
			filtered = filtered.filter((sub) => sub.isActive === query.status);
		}

		if (query.billingUnit) {
			filtered = filtered.filter(
				(sub) => sub.billingUnit === query.billingUnit,
			);
		}

		return filtered;
	}
}
