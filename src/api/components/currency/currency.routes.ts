import { Router } from 'express';
import { catchAsync } from '@/utils/catch.async.js';
import type CurrencyController from './currency.controller.js';

export const path = '/currencies';

export default function currencyRoutes(currencyController: CurrencyController) {
	//Router
	const router = Router();

	// Currency Router
	router
		.route('/')
		.get(
			catchAsync(currencyController.getAllCurrencies.bind(currencyController)),
		)
		.post(
			catchAsync(currencyController.createCurrency.bind(currencyController)),
		);

	router
		.route('/:code')
		.get(
			catchAsync(currencyController.getCurrencyByCode.bind(currencyController)),
		)
		.put(catchAsync(currencyController.updateCurrency.bind(currencyController)))
		.delete(
			catchAsync(currencyController.deleteCurrency.bind(currencyController)),
		);
	return router;
}
