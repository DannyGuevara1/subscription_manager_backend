export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
	exchangeRateToUSD: number;
	rateUpdatedAt: Date;
}

export type UpdateCurrencyData = Partial<Omit<CreateCurrencyData, 'code'>>;

export type CreateCurrencyInput = CreateCurrencyData;

export interface CurrencyDomain {
	code: string;
	name: string;
	symbol: string;
	exchangeRateToUSD: number;
	rateUpdatedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}


export interface OpenExchangeRatesResponse {
	disclaimer: string;
	license: string;
	timestamp: number;
	base: string;
	rates: Record<string, number>;
}
