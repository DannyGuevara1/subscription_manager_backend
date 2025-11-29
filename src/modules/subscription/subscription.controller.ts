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

	async getAllSubscriptions(_req: Request, res: Response, _next: NextFunction) {
		console.log(_req.user);
		res.status(200).json({
			status: 'success',
			data: await this.subscriptionService.getAllSubscriptions(),
		});
	}

	async getSubscriptionById(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const subscription = await this.subscriptionService.getSubscriptionById(id);

		res.status(200).json({
			status: 'success',
			data: subscription,
		});
	}

	async createSubscription(req: Request, res: Response, _next: NextFunction) {
		const data = req.body;
		const newSubscription =
			await this.subscriptionService.createSubscription(data);

		res.status(201).json({
			status: 'success',
			data: newSubscription,
		});
	}

	async updateSubscription(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const data = req.body;

		const updatedSubscription =
			await this.subscriptionService.updateSubscription(id, data);

		res.status(200).json({
			status: 'success',
			data: updatedSubscription,
		});
	}

	async deleteSubscription(
		req: Request<SubscriptionParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const deletedSubscription =
			await this.subscriptionService.deleteSubscription(id);

		res.status(200).json({
			status: 'success',
			data: deletedSubscription,
		});
	}
}
