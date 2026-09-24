import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import type { OpenExchangeRatesResponse } from '@/modules/currency/currency.type.js';
import { internalError } from '@/shared/errors/error.factory.js';

export default class OpenExchangeRateProvider implements ExchangeRateProvider {
	private apiKey: string;
	constructor(apiKey: string) {
		if (!apiKey)
			throw internalError({
				detail: 'OpenExchangeRate provider configuration error',
				extensions: {
					detail: 'API key is not defined',
					severity: 'high',
					timestamp: new Date().toISOString(),
					errorType: 'ConfigurationError',
				},
				metadata: {
					service: 'open-exchange-rate-provider',
				},
				isOperational: false,
			});
		this.apiKey = apiKey;
	}

	private async fetchRates(): Promise<OpenExchangeRatesResponse> {
		const url = `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}`;
		const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

		if (!response.ok) {
			throw internalError({
				detail: 'Failed to fetch exchange rate',
				extensions: {
					detail: 'Failed to fetch exchange rate',
					severity: 'high',
					timestamp: new Date().toISOString(),
					errorType: 'ConfigurationError',
				},
				metadata: {
					service: 'open-exchange-rate-provider',
				},
				isOperational: false,
			});
		}
		const data = (await response.json()) as OpenExchangeRatesResponse;
		if (
			data.base !== 'USD' ||
			!data.rates ||
			data.rates.USD !== 1 ||
			Object.values(data.rates).some(
				(rate) => !Number.isFinite(rate) || rate <= 0,
			)
		) {
			throw internalError({ detail: 'Invalid exchange rate response.' });
		}
		return data;
	}

	async getAllRates(): Promise<Record<string, number>> {
		const data = await this.fetchRates();
		return data.rates;
	}

	async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
		const data = await this.fetchRates();

		const rateTo = data.rates[toCurrency];
		const rateFrom = data.rates[fromCurrency];

		if (!rateTo || !rateFrom) {
			throw internalError({
				detail: 'Currency not found',
				extensions: {
					detail: 'Currency not found',
					severity: 'high',
					timestamp: new Date().toISOString(),
					errorType: 'ConfigurationError',
				},
				metadata: {
					service: 'open-exchange-rate-provider',
				},
				isOperational: false,
			});
		}

		return rateTo / rateFrom;
	}
}
