export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
}

export type UpdateCurrencyData = Omit<Partial<CreateCurrencyData>, 'code'>;
