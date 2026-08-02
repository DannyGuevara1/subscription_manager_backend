export interface ExchangeRateProvider {
	getRate(fromCurrency: string, toCurrency: string): Promise<number>;
	/** Tasas USD-base de todas las monedas en una sola llamada (bulk). */
	getAllRates(): Promise<Record<string, number>>;
}
