import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import {
	type CreateCurrencyData,
	type CreateCurrencyDto,
	type SafeCurrencyDto,
	safeCurrencySchema,
	type UpdateCurrencyDto,
} from '@/modules/currency/index.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';

export default class CurrencyService {
	private currencyRepository: CurrencyRepository;
	constructor(currencyRepository: CurrencyRepository) {
		this.currencyRepository = currencyRepository;
	}
	// Methods GET
	async getAllCurrencies(): Promise<SafeCurrencyDto[]> {
		const currencies = await this.currencyRepository.findAll();
		return currencies.map((currency) => safeCurrencySchema.parse(currency));
	}

	async getCurrencyByCode(code: string): Promise<SafeCurrencyDto> {
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

		return safeCurrencySchema.parse(currency);
	}
	// Method POST
	async createCurrency(data: CreateCurrencyDto): Promise<SafeCurrencyDto> {
		const existingCurrency = await this.currencyRepository.findByCode(
			data.code,
		);
		if (existingCurrency) {
			throw ErrorFactory.conflictError({
				resource: 'Currency',
				identifier: data.code,
				extensions: {
					detail: `Ya existe una moneda con código ${data.code}.`,
				},
			});
		}

		const currencyData: CreateCurrencyData = {
			...data,
		};

		const newCurrency = await this.currencyRepository.create(currencyData);
		return safeCurrencySchema.parse(newCurrency);
	}

	// Method PUT
	async updateCurrency(
		code: string,
		data: UpdateCurrencyDto,
	): Promise<SafeCurrencyDto> {
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
		const updatedCurrency = await this.currencyRepository.update(code, data);
		return safeCurrencySchema.parse(updatedCurrency);
	}

	// Method DELETE
	async deleteCurrency(code: string): Promise<SafeCurrencyDto> {
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

		return safeCurrencySchema.parse(currency);
	}
}
