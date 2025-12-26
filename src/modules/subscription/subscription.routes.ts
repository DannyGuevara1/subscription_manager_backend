import { Router } from 'express';
import {
	createSubscriptionRequestSchema,
	subscriptionParamsRequestSchema,
	updateSubscriptionRequestSchema,
} from '@/modules/subscription/index.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
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
			catchAsync(
				subscriptionController.getAllSubscriptions.bind(subscriptionController),
			),
		)
		.post(
			validateRequest(createSubscriptionRequestSchema),
			catchAsync(
				subscriptionController.createSubscription.bind(subscriptionController),
			),
		);

	router
		.route('/:id')
		.get(
			validateRequest(subscriptionParamsRequestSchema),
			catchAsync(
				subscriptionController.getSubscriptionById.bind(subscriptionController),
			),
		)
		.put(
			validateRequest(updateSubscriptionRequestSchema),
			catchAsync(
				subscriptionController.updateSubscription.bind(subscriptionController),
			),
		)
		.delete(
			validateRequest(subscriptionParamsRequestSchema),
			catchAsync(
				subscriptionController.deleteSubscription.bind(subscriptionController),
			),
		);

	return router;
}
