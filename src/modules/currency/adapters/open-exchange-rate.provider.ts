import type { ExchangeRateProvider } from "@/modules/currency/ports/exchange-rate.provider.js";
import type { OpenExchangeRatesResponse } from '@/modules/currency/currency.type.js'

export default class OpenExchangeRateProvider implements ExchangeRateProvider {
    private apiKey: string;
    constructor(apiKey: string) {
        if (!apiKey) throw new Error('API key is not defined');
        this.apiKey = apiKey;
    }

    async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
        const url = `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }
        const data = await response.json() as OpenExchangeRatesResponse;

        const rateTo = data.rates[toCurrency];
        const rateFrom = data.rates[fromCurrency];

        if (!rateTo || !rateFrom) {
            throw new Error('Currency not found');
        }

        return rateTo / rateFrom;

    }
}
