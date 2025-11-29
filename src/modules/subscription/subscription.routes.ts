import { Router } from 'express';
import { authMiddleware } from '@/modules/auth/auth.middleware.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
import type SubscriptionController from './subscription.controller.js';
export const path = '/subscriptions';

export default function subscriptionRoutes(
	subscriptionController: SubscriptionController,
) {
	//Router
	const router = Router();

	// Subscription Router
	router
		.route('/')
		.get(
			authMiddleware,
			catchAsync(
				subscriptionController.getAllSubscriptions.bind(subscriptionController),
			),
		)
		.post(
			authMiddleware,
			catchAsync(
				subscriptionController.createSubscription.bind(subscriptionController),
			),
		);

	router
		.route('/:id')
		.get(
			authMiddleware,
			catchAsync(
				subscriptionController.getSubscriptionById.bind(subscriptionController),
			),
		)
		.put(
			catchAsync(
				subscriptionController.updateSubscription.bind(subscriptionController),
			),
		)
		.delete(
			catchAsync(
				subscriptionController.deleteSubscription.bind(subscriptionController),
			),
		);

	return router;
}
