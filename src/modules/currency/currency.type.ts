export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
}

export type UpdateCurrencyData = Omit<Partial<CreateCurrencyData>, 'code'>;

export type CreateCurrencyInput = CreateCurrencyData;

export interface CurrencyDomain {
	code: string;
	name: string;
	symbol: string;
	createdAt: Date;
	updatedAt: Date;
}
