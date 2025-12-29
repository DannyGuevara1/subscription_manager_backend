import type { Currency } from '@prisma/client';

export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
}

export type UpdateCurrencyData = Omit<Partial<CreateCurrencyData>, 'code'>;

export type SafeCurrency = Omit<Currency, 'createdAt' | 'updatedAt'>;
