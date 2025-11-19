import type { Currency } from '@prisma/client';
import {
	createCurrencySchema,
	updateCurrencySchema,
} from '@/api/components/currency/currency.dto.js';
import { ErrorFactory } from '@/errors/error.factory.js';
import type CurrencyRepository from '@/repositories/currency/currency.repository.js';

export default class CurrencyService {
	private currencyRepository: CurrencyRepository;
	constructor(currencyRepository: CurrencyRepository) {
		this.currencyRepository = currencyRepository;
	}
	// Methods GET
	async getAllCurrencies(): Promise<Currency[]> {
		return this.currencyRepository.findAll();
	}

	async getCurrencyByCode(code: string): Promise<Currency> {
		const currency = await this.currencyRepository.findByCode(code);

		if (!currency) {
			throw ErrorFactory.notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No se encontró ninguna moneda con código ${code}.`,
				},
			});
		}

		return currency;
	}
	// Method POST
	async createCurrency(data: Currency): Promise<Currency> {
		const validatedData = createCurrencySchema.parse(data);
		const existingCurrency = await this.currencyRepository.findByCode(
			validatedData.code,
		);
		if (existingCurrency) {
			throw ErrorFactory.conflictError({
				resource: 'Currency',
				identifier: validatedData.code,
				extensions: {
					detail: `Ya existe una moneda con código ${validatedData.code}.`,
				},
			});
		}
		return this.currencyRepository.create(validatedData);
	}

	// Method PUT
	async updateCurrency(
		code: string,
		data: Partial<Currency>,
	): Promise<Currency | null> {
		const validatedData = updateCurrencySchema.parse(data);
		const existingCurrency = await this.currencyRepository.findByCode(code);
		if (!existingCurrency) {
			throw ErrorFactory.notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No se encontró ninguna moneda con código ${code}.`,
				},
			});
		}
		return this.currencyRepository.update(code, validatedData);
	}

	// Method DELETE
	async deleteCurrency(code: string): Promise<Currency> {
		const currency = await this.currencyRepository.delete(code);

		if (!currency) {
			throw ErrorFactory.notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No se encontró ninguna moneda con código ${code}.`,
				},
			});
		}

		return currency;
	}
}
