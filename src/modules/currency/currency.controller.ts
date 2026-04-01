import type { NextFunction, Request, Response } from 'express';
import type {
	CreateCurrencyDto,
	CurrencyParamsDto,
	UpdateCurrencyDto,
} from '@/modules/currency/currency.dto.js';
import { safeCurrencySchema } from '@/modules/currency/currency.dto.js';
import type CurrencyService from '@/modules/currency/currency.service.js';

export default class CurrencyController {
	private currencyService: CurrencyService;

	constructor(currencyService: CurrencyService) {
		this.currencyService = currencyService;
	}

	async getAllCurrencies(_req: Request, res: Response, _next: NextFunction) {
		const currencies = await this.currencyService.getAllCurrencies();
		const serializedCurrencies = currencies.map((currency) =>
			safeCurrencySchema.parse(currency),
		);
		res.status(200).json({
			data: { currencies: serializedCurrencies },
		});
	}

	async getCurrencyByCode(
		req: Request,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.validated.params as CurrencyParamsDto;
		const currency = await this.currencyService.getCurrencyByCode(code);

		res.status(200).json({ data: safeCurrencySchema.parse(currency) });
	}

	async createCurrency(req: Request, res: Response, _next: NextFunction) {
		const currencyData = req.validated.body as CreateCurrencyDto;
		const newCurrency = await this.currencyService.createCurrency(currencyData);

		res.status(201).json({
			data: safeCurrencySchema.parse(newCurrency),
		});
	}

	async updateCurrency(
		req: Request,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.validated.params as CurrencyParamsDto;
		const currencyData = req.validated.body as UpdateCurrencyDto;
		const updatedCurrency = await this.currencyService.updateCurrency(
			code,
			currencyData,
		);
		res.status(200).json({
			data: safeCurrencySchema.parse(updatedCurrency),
		});
	}

	async deleteCurrency(
		req: Request,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.validated.params as CurrencyParamsDto;
		await this.currencyService.deleteCurrency(code);

		res.status(204).send();
	}
}
