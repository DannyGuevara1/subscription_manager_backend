import { currencyConversionError } from '@/modules/currency/errors/currency-conversion.error.js';
import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';

export default class NoopExchangeRateProvider implements ExchangeRateProvider {
	async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
		if (fromCurrency !== toCurrency) {
			throw currencyConversionError(fromCurrency, toCurrency);
		}
		return 1;
	}

	async getAllRates(): Promise<Record<string, number>> {
		return { USD: 1 };
	}
}
