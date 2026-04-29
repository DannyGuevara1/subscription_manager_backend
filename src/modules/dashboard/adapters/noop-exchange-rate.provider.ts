import { currencyConversionError } from '@/modules/dashboard/errors/currency-conversion.error.js';
import type { ExchangeRateProvider } from '@/modules/dashboard/ports/exchange-rate.provider.js';

export default class NoopExchangeRateProvider implements ExchangeRateProvider {
	async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
		if (fromCurrency !== toCurrency) {
			throw currencyConversionError(fromCurrency, toCurrency);
		}
		return 1;
	}
}
