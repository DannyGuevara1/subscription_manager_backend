import type { NextFunction, Request, Response } from 'express';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type {
	SafeExpensesByCategoryDto,
	SafePaymentTimelineEntryDto,
} from '@/modules/analytics/analytics.dto.js';
import {
	safeExpensesByCategorySchema,
	safePaymentTimelineEntrySchema,
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

		const expenses = await this.analyticsService.getExpensesByCategory(
			userAuth,
			query,
		);

		const serialized: SafeExpensesByCategoryDto =
			safeExpensesByCategorySchema.parse(expenses);

		res.status(200).json({
			data: serialized,
		});
	}

	/**
	 * GET /analytics/payment-timeline
	 * Returns a chronological payment timeline from firstPaymentDate to one year from now.
	 * @query status - Optional boolean to filter active/inactive subscriptions
	 * @query billingUnit - Optional filter by billing unit (WEEKS | MONTHS | YEARS)
	 */
	async getPaymentTimeline(req: Request, res: Response, _next: NextFunction) {
		const userAuth = req.user as JWTPayload;
		const query = (req.validated.query ?? {}) as ExpensesByCategoryQuery;

		const timeline = await this.analyticsService.getPaymentTimeline(
			userAuth,
			query,
		);

		const serialized: SafePaymentTimelineEntryDto[] = timeline.map((entry) =>
			safePaymentTimelineEntrySchema.parse(entry),
		);

		res.status(200).json({
			data: serialized,
		});
	}
}
