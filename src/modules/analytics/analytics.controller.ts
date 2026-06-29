import type { NextFunction, Request, Response } from 'express';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type {
	SafeExpensesByCategoryDto,
	SafePaymentHistoryDto,
} from '@/modules/analytics/analytics.dto.js';
import {
	safeExpensesByCategorySchema,
	safePaymentHistorySchema,
} from '@/modules/analytics/analytics.dto.js';
import type AnalyticsService from '@/modules/analytics/analytics.service.js';
import type { ExpensesByCategoryQuery } from '@/modules/analytics/analytics.type.js';

/**
 * Handles HTTP requests for analytics endpoints.
 * All methods require authentication via JWTPayload.
 */
export default class AnalyticsController {
	private analyticsService: AnalyticsService;
	constructor(analyticsService: AnalyticsService) {
		this.analyticsService = analyticsService;
	}

	/**
	 * GET /analytics/expenses-by-category
	 * Returns aggregated expenses grouped by category, normalized to user's primary currency.
	 * @query status - Optional boolean to filter active/inactive subscriptions
	 * @query billingUnit - Optional filter by billing unit (WEEKS | MONTHS | YEARS)
	 */
	async getExpensesByCategory(
		req: Request,
		res: Response,
		_next: NextFunction,
	) {
		const userAuth = req.user as JWTPayload;
		const query = (req.validated.query ?? {}) as ExpensesByCategoryQuery;

		const expenses =
			await this.analyticsService.getExpensesByCategory(userAuth, query);

		const serialized: SafeExpensesByCategoryDto =
			safeExpensesByCategorySchema.parse(expenses);

		res.status(200).json({
			data: serialized,
		});
	}

	/**
	 * GET /analytics/payment-history
	 * Returns a chronological projection of future payments for the next year.
	 * @query status - Optional boolean to filter active/inactive subscriptions
	 * @query billingUnit - Optional filter by billing unit (WEEKS | MONTHS | YEARS)
	 */
	async getPaymentHistory(req: Request, res: Response, _next: NextFunction) {
		const userAuth = req.user as JWTPayload;
		const query = (req.validated.query ?? {}) as ExpensesByCategoryQuery;

		const history =
			await this.analyticsService.getPaymentHistory(userAuth, query);

		const serialized: SafePaymentHistoryDto[] = history.map((entry) =>
			safePaymentHistorySchema.parse(entry),
		);

		res.status(200).json({
			data: serialized,
		});
	}
}
