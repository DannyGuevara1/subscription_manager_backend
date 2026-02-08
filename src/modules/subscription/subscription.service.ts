import { uuidv7 } from 'uuidv7';
import {
	type CreateSubscriptionDto,
	type SafeSubscriptionDto,
	type SubscriptionRepository,
	safeSubscriptionSchema,
	type UpdateSubscriptionDto,
} from '@/modules/subscription/index.js';
import type {
	CreateSubscriptionData,
	UpdateSubscriptionData,
} from '@/modules/subscription/subscription.type.js';
import {
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';

export default class SubscriptionService {
	private subscriptionRepository: SubscriptionRepository;

	constructor(subscriptionRepository: SubscriptionRepository) {
		this.subscriptionRepository = subscriptionRepository;
	}

	async getAllSubscriptions(): Promise<SafeSubscriptionDto[]> {
		const subscriptions = await this.subscriptionRepository.findAll();
		return subscriptions.map((subscription) =>
			safeSubscriptionSchema.parse(subscription),
		);
	}

	async getSubscriptionById(
		id: string,
		userId: string,
	): Promise<SafeSubscriptionDto | null> {
		const subscription = await this.subscriptionRepository.findById(id);

		if (!subscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		if (subscription.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para acceder a esta suscripción.`,
				instance: `/subscriptions/${id}`,
			});
		}

		return safeSubscriptionSchema.parse(subscription);
	}

	async createSubscription(
		data: CreateSubscriptionDto,
	): Promise<SafeSubscriptionDto> {
		const id = uuidv7();

		const subscriptionData: CreateSubscriptionData = {
			id,
			...data,
		};

		const newSubscription =
			await this.subscriptionRepository.create(subscriptionData);
		return safeSubscriptionSchema.parse(newSubscription);
	}

	async updateSubscription(
		id: string,
		data: UpdateSubscriptionDto,
		userId: string,
	): Promise<SafeSubscriptionDto> {
		const existingSubscription = await this.subscriptionRepository.findById(id);
		if (!existingSubscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		if (existingSubscription.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para modificar esta suscripción.`,
			});
		}

		const subscriptionData: UpdateSubscriptionData = {
			...data,
		};

		const subscription = await this.subscriptionRepository.update(
			id,
			subscriptionData,
		);

		return safeSubscriptionSchema.parse(subscription);
	}

	async deleteSubscription(
		id: string,
		userId: string,
	): Promise<SafeSubscriptionDto> {
		const deletedSubscription = await this.subscriptionRepository.delete(id);

		if (!deletedSubscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		if (deletedSubscription.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para eliminar esta suscripción.`,
			});
		}

		return safeSubscriptionSchema.parse(deletedSubscription);
	}
}
