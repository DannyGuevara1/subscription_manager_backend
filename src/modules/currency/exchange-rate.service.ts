import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import logger from '@/config/logger.js';
import { internalError, notFoundError } from '@/shared/errors/error.factory.js';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export default class ExchangeRateService {
	private readonly refreshing = new Map<string, Promise<void>>();

	constructor(
		private readonly exchangeRateProvider: ExchangeRateProvider,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	private validateRate(rate: number): number {
		if (!Number.isFinite(rate) || rate <= 0) {
			throw internalError({
				detail: 'Exchange rate is unavailable or invalid.',
			});
		}
		return rate;
	}

	async getRateToUSD(currencyCode: string): Promise<number> {
		return (await this.getRatesToUSD([currencyCode])).get(currencyCode)!;
	}

	/** One DB snapshot per calculation. Values are USD per unit of currency. */
	async getRatesToUSD(currencyCodes: string[]): Promise<Map<string, number>> {
		const codes = [...new Set(currencyCodes)].filter((code) => code !== 'USD');
		const rates = new Map<string, number>([['USD', 1]]);
		if (codes.length === 0) return rates;
		const currencies = await this.currencyRepository.findByCodes(codes);
		const byCode = new Map(
			currencies.map((currency) => [currency.code, currency]),
		);
		for (const code of codes) {
			const currency = byCode.get(code);
			if (!currency)
				throw notFoundError({ resource: 'Currency', identifier: code });
			rates.set(code, this.validateRate(currency.exchangeRateToUSD));
			if (Date.now() - currency.rateUpdatedAt.getTime() >= MAX_AGE_MS) {
				void this.refreshRate(code);
			}
		}
		return rates;
	}

	/** Provider bulk contract: currency units per USD; persist the reciprocal. */
	async updateAllRates(): Promise<number> {
		try {
			const rates = await this.exchangeRateProvider.getAllRates();
			const currencies = await this.currencyRepository.findAll();
			const now = new Date();
			let updated = 0;
			for (const currency of currencies) {
				const quote = rates[currency.code];
				if (quote == null) continue;
				const rate = this.validateRate(1 / this.validateRate(quote));
				await this.currencyRepository.update(currency.code, {
					exchangeRateToUSD: rate,
					rateUpdatedAt: now,
				});
				updated++;
			}
			return updated;
		} catch (err) {
			logger.error({ err }, 'Failed to update all exchange rates');
			return 0;
		}
	}

	private refreshRate(code: string): Promise<void> {
		const pending = this.refreshing.get(code);
		if (pending) return pending;
		const refresh = this.updateRateInBackground(code).finally(() => {
			this.refreshing.delete(code);
		});
		this.refreshing.set(code, refresh);
		return refresh;
	}

	private async updateRateInBackground(currencyCode: string): Promise<void> {
		try {
			const rate = this.validateRate(
				await this.exchangeRateProvider.getRate(currencyCode, 'USD'),
			);
			await this.currencyRepository.update(currencyCode, {
				exchangeRateToUSD: rate,
				rateUpdatedAt: new Date(),
			});
		} catch (err) {
			logger.error({ err, currencyCode }, 'Failed to update exchange rate');
		}
	}
}
