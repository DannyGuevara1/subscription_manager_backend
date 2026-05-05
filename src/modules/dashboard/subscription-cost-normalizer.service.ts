import type { DashboardSummary, NormalizedSubscriptionCost } from '@/modules/dashboard/dashboard.type.js';
import type { ExchangeRateProvider } from '@/modules/dashboard/ports/exchange-rate.provider.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';
import type { BillingUnit } from '@prisma/client';
export default class SubscriptionCostNormalizerService {
	private exchangeRateProvider: ExchangeRateProvider;

	constructor(exchangeRateProvider: ExchangeRateProvider) {
		this.exchangeRateProvider = exchangeRateProvider;
	}
	async normalize(
		subscription: SubscriptionDomain,
		primaryCurrency: string,
	): Promise<NormalizedSubscriptionCost> {
		const rate = await this.exchangeRateProvider.getRate(
			subscription.currencyCode,
			primaryCurrency,
		);

		const baseCost: number =
			Number(subscription.cost) * subscription.billingFrequency * rate;
		let projectedMonthly: number = 0;
		switch (subscription.billingUnit) {
			case 'DAYS':
				projectedMonthly = (baseCost * 365) / 12;
				break;
			case 'WEEKS':
				projectedMonthly = (baseCost * 52) / 12;
				break;
			case 'MONTHS':
				projectedMonthly = baseCost;
				break;
			case 'YEARS':
				projectedMonthly = baseCost / 12;
				break;
		}

		const projectedAnnual = projectedMonthly * 12;
		const isInTrial = subscription.trialEndsOn
			? subscription.trialEndsOn > new Date()
			: false;
		const currentMonthly = isInTrial ? 0 : projectedMonthly;
		const currentAnnual = isInTrial ? 0 : projectedAnnual;

		return {
			projectedMonthly: projectedMonthly,
			projectedAnnual: projectedAnnual,
			currentMonthly: currentMonthly,
			currentAnnual: currentAnnual,
			billingUnit: subscription.billingUnit,
		};
	}

	async normalizeAll(
		subscriptions: SubscriptionDomain[],
		primaryCurrency: string,
	): Promise<DashboardSummary> {

		let normalizedCosts: NormalizedSubscriptionCost[] = [];

		for (const subscription of subscriptions) {
			const normalizedCost = await this.normalize(subscription, primaryCurrency);
			normalizedCosts.push(normalizedCost);

		}

		let totalProjectedMonthly = 0;
		let totalCurrentMonthly = 0;
		const expensesByType: Record<BillingUnit, number> = {
			DAYS: 0,
			WEEKS: 0,
			MONTHS: 0,
			YEARS: 0
		};

		for (const cost of normalizedCosts) {
			totalProjectedMonthly += cost.projectedMonthly;
			totalCurrentMonthly += cost.currentMonthly;
			expensesByType[cost.billingUnit] += cost.projectedMonthly;
		}

		const totalProjectedAnnual = totalProjectedMonthly * 12;
		const totalCurrentAnnual = totalCurrentMonthly * 12;

		return {
			totalMonthly: totalProjectedMonthly.toFixed(2),
			totalAnnual: totalProjectedAnnual.toFixed(2),
			currentMonthly: totalCurrentMonthly.toFixed(2),
			currentAnnual: totalCurrentAnnual.toFixed(2),
			projectedMonthly: totalProjectedMonthly.toFixed(2),
			projectedAnnual: totalProjectedAnnual.toFixed(2),
			currencyCode: primaryCurrency,
			expensesByType: {
				DAYS: expensesByType.DAYS.toFixed(2),
				WEEKS: expensesByType.WEEKS.toFixed(2),
				MONTHS: expensesByType.MONTHS.toFixed(2),
				YEARS: expensesByType.YEARS.toFixed(2),
			},
		};
	}
}
