import { uuidv7 } from 'uuidv7';
import {
	type CreateSubscriptionDto,
	type SafeSubscriptionDto,
	safeSubscriptionDto,
	type UpdateSubscriptionDto,
} from '@/modules/subscription/subscription.dto.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';
import type {
	CreateSubscriptionData,
	UpdateSubscriptionData,
} from '@/modules/subscription/subscription.type.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';

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
		data: CreateSubscriptionDto,
	): Promise<SafeSubscriptionDto> {
		const {
			userId,
			billingFrequency,
			billingUnit,
			categoryId,
			cost,
			costType,
			currencyCode,
			firstPaymentDate,
			name,
			trialEndsOn,
		} = data;
		const id = uuidv7();

		const subscriptionData: CreateSubscriptionData = {
			id,
			userId: userId,
			categoryId: categoryId,
			currencyCode: currencyCode,
			name: name,
			cost: cost,
			costType: costType,
			billingFrequency: billingFrequency,
			billingUnit: billingUnit,
			firstPaymentDate: firstPaymentDate,
			trialEndsOn: trialEndsOn,
		};

		const newSubscription =
			await this.subscriptionRepository.create(subscriptionData);
		return safeSubscriptionDto.parse(newSubscription);
	}

	async updateSubscription(
		id: string,
		data: UpdateSubscriptionDto,
	): Promise<SafeSubscriptionDto> {
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
			...data,
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
