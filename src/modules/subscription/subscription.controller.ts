import type { NextFunction, Request, Response } from 'express';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';

interface SubscriptionParams {
	id: string;
}

export default class SubscriptionController {
	private subscriptionService: SubscriptionService;
	constructor(subscriptionService: SubscriptionService) {
		this.subscriptionService = subscriptionService;
	}

	async getAllSubscriptions(req: Request, res: Response, _next: NextFunction) {
		const sub = req.user?.sub as string;
		const subscriptions =
			await this.subscriptionService.getAllSubscriptions(sub);
		res.status(200).json({
			data: { subscriptions },
		});
	}

	async getSubscriptionById(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const sub = req.user?.sub as string;
		const subscription = await this.subscriptionService.getSubscriptionById(
			id,
			sub,
		);

		res.status(200).json({
			data: subscription,
		});
	}

	async createSubscription(req: Request, res: Response, _next: NextFunction) {
		const data = req.body;
		const authUser = req.user as NonNullable<Request['user']>;
		const newSubscription = await this.subscriptionService.createSubscription(
			data,
			authUser,
		);

		res.status(201).json({
			data: newSubscription,
		});
	}

	async updateSubscription(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const sub = req.user?.sub as string;
		const data = req.body;

		const updatedSubscription =
			await this.subscriptionService.updateSubscription(id, data, sub);

		res.status(200).json({
			data: updatedSubscription,
		});
	}

	async deleteSubscription(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const sub = req.user?.sub as string;

		await this.subscriptionService.deleteSubscription(id, sub);

		res.status(204).send();
	}
}
