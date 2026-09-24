import type { BillingUnit } from '@prisma/client';
import type {
	DashboardSummary,
	NormalizedSubscriptionCost,
} from '@/modules/dashboard/dashboard.type.js';
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';
export default class SubscriptionCostNormalizerService {
	constructor(
		private readonly exchangeRateService: Pick<
			ExchangeRateService,
			'getRatesToUSD'
		>,
	) {}
	async normalize(
		subscription: SubscriptionDomain,
		primaryCurrency: string,
	): Promise<NormalizedSubscriptionCost> {
		const rates = await this.exchangeRateService.getRatesToUSD([
			subscription.currencyCode,
			primaryCurrency,
		]);
		return this.normalizeWithRate(
			subscription,
			rates.get(subscription.currencyCode)! / rates.get(primaryCurrency)!,
		);
	}

	private normalizeWithRate(
		subscription: SubscriptionDomain,
		rate: number,
	): NormalizedSubscriptionCost {
		// Frequency is the interval between charges (e.g. USD 24 every 2 years).
		const baseCost = (subscription.cost / subscription.billingFrequency) * rate;
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
		const rates = await this.exchangeRateService.getRatesToUSD([
			primaryCurrency,
			...subscriptions.map((sub) => sub.currencyCode),
		]);
		const primaryRate = rates.get(primaryCurrency)!;
		const normalizedCosts = subscriptions.map((sub) =>
			this.normalizeWithRate(sub, rates.get(sub.currencyCode)! / primaryRate),
		);

		let totalProjectedMonthly = 0;
		let totalCurrentMonthly = 0;
		const expensesByType: Record<BillingUnit, number> = {
			DAYS: 0,
			WEEKS: 0,
			MONTHS: 0,
			YEARS: 0,
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
