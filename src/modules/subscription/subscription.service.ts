import { uuidv7 } from 'uuidv7';
import {
	type CreateSubscriptionInput,
	createSubscriptionSchema,
	type SafeSubscriptionDto,
	safeSubscriptionDto,
	type UpdateSubscriptionInput,
	updateSubscriptionSchema,
} from '@/modules/subscription/subscription.dto.js';
import type {
	CreateSubscriptionData,
	UpdateSubscriptionData,
} from '@/modules/subscription/subscription.type.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';

export default class SubscriptionService {
	private subscriptionRepository: SubscriptionRepository;

	constructor(subscriptionRepository: SubscriptionRepository) {
		this.subscriptionRepository = subscriptionRepository;
	}

	async getAllSubscriptions(): Promise<SafeSubscriptionDto[]> {
		const subscriptions = await this.subscriptionRepository.findAll();
		return subscriptions.map((subscription) =>
			safeSubscriptionDto.parse(subscription),
		);
	}

	async getSubscriptionById(id: string): Promise<SafeSubscriptionDto | null> {
		const subscription = await this.subscriptionRepository.findById(id);

		if (!subscription) {
			throw ErrorFactory.notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		return safeSubscriptionDto.parse(subscription);
	}

	async createSubscription(
		data: CreateSubscriptionInput,
	): Promise<SafeSubscriptionDto> {
		const validatedData = createSubscriptionSchema.parse(data);

		const id = uuidv7();

		const subscriptionData: CreateSubscriptionData = {
			id,
			userId: validatedData.userId,
			categoryId: validatedData.categoryId,
			currencyCode: validatedData.currencyCode,
			name: validatedData.name,
			cost: validatedData.cost,
			costType: validatedData.costType,
			billingFrequency: validatedData.billingFrequency,
			billingUnit: validatedData.billingUnit,
			firstPaymentDate: validatedData.firstPaymentDate,
			trialEndsOn: validatedData.trialEndsOn,
		};

		const newSubscription =
			await this.subscriptionRepository.create(subscriptionData);
		return safeSubscriptionDto.parse(newSubscription);
	}

	async updateSubscription(
		id: string,
		data: UpdateSubscriptionInput,
	): Promise<SafeSubscriptionDto> {
		const validatedData = updateSubscriptionSchema.parse(data);

		const existingSubscription = await this.subscriptionRepository.findById(id);
		if (!existingSubscription) {
			throw ErrorFactory.notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		const subscriptionData: UpdateSubscriptionData = {
			...validatedData,
		};

		const subscription = await this.subscriptionRepository.update(
			id,
			subscriptionData,
		);

		return safeSubscriptionDto.parse(subscription);
	}

	async deleteSubscription(id: string): Promise<SafeSubscriptionDto> {
		const deletedSubscription = await this.subscriptionRepository.delete(id);

		if (!deletedSubscription) {
			throw ErrorFactory.notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No se encontró ninguna suscripción con ID ${id}.`,
				},
			});
		}

		return safeSubscriptionDto.parse(deletedSubscription);
	}
}
