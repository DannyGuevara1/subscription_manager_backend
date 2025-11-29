import type { Currency } from '@prisma/client';

export interface CreateCurrencyData {
	code: string;
	name: string;
	symbol: string;
}

export interface UpdateCurrencyData {
	code?: string;
	name?: string;
	symbol?: string;
}

export type SafeCurrency = Omit<Currency, 'createdAt' | 'updatedAt'>;
