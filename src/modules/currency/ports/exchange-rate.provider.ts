export interface ExchangeRateProvider {
	getRate(fromCurrency: string, toCurrency: string): Promise<number>;
}
