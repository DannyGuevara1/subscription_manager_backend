import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import type {
	CreateCurrencyInput,
	CreateCurrencyData,
	CurrencyDomain,
	UpdateCurrencyData,
} from '@/modules/currency/currency.type.js';
import { conflictError, notFoundError } from '@/shared/errors/error.factory.js';

export default class CurrencyService {
	private currencyRepository: CurrencyRepository;
	constructor(currencyRepository: CurrencyRepository) {
		this.currencyRepository = currencyRepository;
	}
	// Methods GET
	async getAllCurrencies(): Promise<CurrencyDomain[]> {
		return this.currencyRepository.findAll();
	}

	async getCurrencyByCode(code: string): Promise<CurrencyDomain> {
		const currency = await this.currencyRepository.findByCode(code);

		if (!currency) {
			throw notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No currency found with code ${code}.`,
				},
			});
		}

		return currency;
	}
	// Method POST
	async createCurrency(data: CreateCurrencyInput): Promise<CurrencyDomain> {
		const existingCurrency = await this.currencyRepository.findByCode(
			data.code,
		);
		if (existingCurrency) {
			throw conflictError({
				resource: 'Currency',
				identifier: data.code,
				extensions: {
					detail: `A currency with code ${data.code} already exists.`,
				},
			});
		}

		const currencyData: CreateCurrencyData = {
			...data,
		};

		return this.currencyRepository.create(currencyData);
	}

	// Method PUT
	async updateCurrency(
		code: string,
		data: UpdateCurrencyData,
	): Promise<CurrencyDomain> {
		const existingCurrency = await this.currencyRepository.findByCode(code);
		if (!existingCurrency) {
			throw notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No currency found with code ${code}.`,
				},
			});
		}
		const updateData: UpdateCurrencyData = {
			...data,
		};
		const updatedCurrency = await this.currencyRepository.update(
			code,
			updateData,
		);
		return updatedCurrency;
	}

	// Method DELETE
	async deleteCurrency(code: string): Promise<CurrencyDomain> {
		const existingCurrency = await this.currencyRepository.findByCode(code);

		if (!existingCurrency) {
			throw notFoundError({
				resource: 'Currency',
				identifier: code,
				extensions: {
					detail: `No currency found with code ${code}.`,
				},
			});
		}

		return this.currencyRepository.delete(code);
	}
}
