import type { NextFunction, Request, Response } from 'express';
import type CurrencyService from '@/modules/currency/currency.service.js';

interface currencyParams {
	code: string;
}

export default class CurrencyController {
	private currencyService: CurrencyService;

	constructor(currencyService: CurrencyService) {
		this.currencyService = currencyService;
	}

	async getAllCurrencies(_req: Request, res: Response, _next: NextFunction) {
		res.status(200).json({
			status: 'success',
			data: await this.currencyService.getAllCurrencies(),
		});
	}

	async getCurrencyByCode(
		req: Request<currencyParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.params;
		const currency = await this.currencyService.getCurrencyByCode(code);

		res.status(200).json(currency);
	}

	async createCurrency(req: Request, res: Response, _next: NextFunction) {
		const currencyData = req.body;
		const newCurrency = await this.currencyService.createCurrency(currencyData);

		res.status(201).json({
			status: 'success',
			data: newCurrency,
		});
	}

	async updateCurrency(
		req: Request<currencyParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.params;
		const currencyData = req.body;
		const updatedCurrency = await this.currencyService.updateCurrency(
			code,
			currencyData,
		);
		res.status(200).json({
			status: 'success',
			data: updatedCurrency,
		});
	}

	async deleteCurrency(
		req: Request<currencyParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { code } = req.params;
		const deletedCurrency = await this.currencyService.deleteCurrency(code);

		res.status(200).json({
			status: 'success',
			data: deletedCurrency,
		});
	}
}
