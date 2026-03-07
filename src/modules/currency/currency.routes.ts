import { Router } from 'express';
import {
	createCurrencyRequestSchema,
	currencyParamsRequestSchema,
	updateCurrencyRequestSchema,
} from '@/modules/currency/index.js';
import { authorize } from '@/shared/middleware/authorize.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
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
			authorize('ADMIN'),
			validateRequest(createCurrencyRequestSchema),
			catchAsync(currencyController.createCurrency.bind(currencyController)),
		);

	router
		.route('/:code')
		.get(
			validateRequest(currencyParamsRequestSchema),
			catchAsync(currencyController.getCurrencyByCode.bind(currencyController)),
		)
		.put(
			authorize('ADMIN'),
			validateRequest(updateCurrencyRequestSchema),
			catchAsync(currencyController.updateCurrency.bind(currencyController)),
		)
		.delete(
			authorize('ADMIN'),
			validateRequest(currencyParamsRequestSchema),
			catchAsync(currencyController.deleteCurrency.bind(currencyController)),
		);
	return router;
}
