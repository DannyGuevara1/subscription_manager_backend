import type { NormalizedSubscriptionCost } from '@/modules/dashboard/dashboard.type.js';
import type { ExchangeRateProvider } from '@/modules/dashboard/ports/exchange-rate.provider.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';
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
			projectedMonthly: Number(projectedMonthly.toFixed(2)),
			projectedAnnual: Number(projectedAnnual.toFixed(2)),
			currentMonthly: Number(currentMonthly.toFixed(2)),
			currentAnnual: Number(currentAnnual.toFixed(2)),
			billingUnit: subscription.billingUnit,
		};
	}

	async normalizeAll(
		subscriptions: SubscriptionDomain[],
		primaryCurrency: string,
	) {}
}
