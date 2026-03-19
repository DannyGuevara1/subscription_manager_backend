import { uuidv7 } from 'uuidv7';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type CurrencyService from '@/modules/currency/currency.service.js';
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
	private categoryService: CategoryService;
	private currencyService: CurrencyService;

	constructor(
		subscriptionRepository: SubscriptionRepository,
		categoryService: CategoryService,
		currencyService: CurrencyService,
	) {
		this.subscriptionRepository = subscriptionRepository;
		this.categoryService = categoryService;
		this.currencyService = currencyService;
	}

	async getAllSubscriptions(userId: string): Promise<SafeSubscriptionDto[]> {
		const subscriptions = await this.subscriptionRepository.findAll(userId);
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
		authUser: JWTPayload,
	): Promise<SafeSubscriptionDto> {
		const userId = authUser.sub;

		// Validate FK existence
		await this.currencyService.getCurrencyByCode(data.currencyCode);

		// Validate category exists and belongs to the user
		const category = await this.categoryService.getCategoryById(
			data.categoryId,
			userId,
		);
		if (category.userId !== userId) {
			throw forbiddenError({
				detail: `La categoría no pertenece al usuario.`,
				instance: `/subscriptions`,
			});
		}

		// Auto-set firstPaymentDate when trialEndsOn is provided
		const firstPaymentDate = data.trialEndsOn
			? data.trialEndsOn
			: data.firstPaymentDate;

		const id = uuidv7();

		const subscriptionData: CreateSubscriptionData = {
			id,
			userId,
			...data,
			firstPaymentDate,
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

		// Validate FK existence when provided
		if (data.currencyCode) {
			await this.currencyService.getCurrencyByCode(data.currencyCode);
		}

		if (data.categoryId) {
			const category = await this.categoryService.getCategoryById(
				data.categoryId,
				userId,
			);
			if (category.userId !== userId) {
				throw forbiddenError({
					detail: `La categoría no pertenece al usuario.`,
					instance: `/subscriptions/${id}`,
				});
			}
		}

		// Auto-set firstPaymentDate when trialEndsOn is provided
		const subscriptionData: UpdateSubscriptionData = {
			...data,
			...(data.trialEndsOn && { firstPaymentDate: data.trialEndsOn }),
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
				detail: `No tiene permiso para eliminar esta suscripción.`,
			});
		}

		const deletedSubscription = await this.subscriptionRepository.delete(id);
		return safeSubscriptionSchema.parse(deletedSubscription);
	}
}
