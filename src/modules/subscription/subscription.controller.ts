import type { NextFunction, Request, Response } from 'express';
import type {
	CreateSubscriptionDto,
	SubscriptionCursorPaginationQueryDto,
	SubscriptionParamsDto,
	UpdateSubscriptionDto,
} from '@/modules/subscription/subscription.dto.js';
import { safeSubscriptionSchema } from '@/modules/subscription/subscription.dto.js';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';

export default class SubscriptionController {
	private subscriptionService: SubscriptionService;
	constructor(subscriptionService: SubscriptionService) {
		this.subscriptionService = subscriptionService;
	}

	async getAllSubscriptions(req: Request, res: Response, _next: NextFunction) {
		const sub = req.user?.sub as string;
		const { cursor, limit } = req.validated
			.query as SubscriptionCursorPaginationQueryDto;
		const paginatedSubscriptions =
			await this.subscriptionService.getAllSubscriptions(sub, {
				cursor,
				limit,
			});

		const serializedSubscriptions = paginatedSubscriptions.subscriptions.map(
			(subscription) => safeSubscriptionSchema.parse(subscription),
		);

		res.status(200).json({
			data: {
				subscriptions: serializedSubscriptions,
			},
			meta: {
				nextCursor: paginatedSubscriptions.nextCursor,
				hasNextPage: paginatedSubscriptions.hasNextPage,
			},
		});
	}

	async getSubscriptionById(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as SubscriptionParamsDto;
		const sub = req.user?.sub as string;
		const subscription = await this.subscriptionService.getSubscriptionById(
			id,
			sub,
		);

		res.status(200).json({
			data: safeSubscriptionSchema.parse(subscription),
		});
	}

	async createSubscription(req: Request, res: Response, _next: NextFunction) {
		const data = req.validated.body as CreateSubscriptionDto;
		const authUser = req.user as NonNullable<Request['user']>;
		const newSubscription = await this.subscriptionService.createSubscription(
			data,
			authUser,
		);

		res.status(201).json({
			data: safeSubscriptionSchema.parse(newSubscription),
		});
	}

	async updateSubscription(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as SubscriptionParamsDto;
		const sub = req.user?.sub as string;
		const data = req.validated.body as UpdateSubscriptionDto;

		const updatedSubscription =
			await this.subscriptionService.updateSubscription(id, data, sub);

		res.status(200).json({
			data: safeSubscriptionSchema.parse(updatedSubscription),
		});
	}

	async deleteSubscription(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as SubscriptionParamsDto;
		const sub = req.user?.sub as string;

		await this.subscriptionService.deleteSubscription(id, sub);

		res.status(204).send();
	}
}
