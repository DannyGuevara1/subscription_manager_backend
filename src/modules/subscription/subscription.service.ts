import { uuidv7 } from 'uuidv7';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type CurrencyService from '@/modules/currency/currency.service.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';
import type {
	CreateSubscriptionData,
	CreateSubscriptionInput,
	SubscriptionCursorPaginationOptions,
	SubscriptionCursorPaginationPage,
	SubscriptionDomain,
	UpdateSubscriptionData,
	UpdateSubscriptionStatusData,
} from '@/modules/subscription/subscription.type.js';
import {
	forbiddenError,
	notFoundError,
	conflictError,
} from '@/shared/errors/error.factory.js';
import { buildCursorPaginationWindow } from '@/shared/utils/pagination-cursor.util.js';

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

	async getAllSubscriptions(
		userId: string,
		options: SubscriptionCursorPaginationOptions,
	): Promise<SubscriptionCursorPaginationPage> {
		const { cursor, limit, billingCycle, categoryId, status } = options;
		const { subscriptions: subscriptionList } =
			await this.subscriptionRepository.findAllWithCursor(userId, {
				cursor,
				limit: limit + 1,
				billingCycle,
				categoryId,
				status,
			});

		const paginatedWindow = buildCursorPaginationWindow({
			items: subscriptionList,
			limit,
			getCursor: (subscription) => subscription.id,
		});

		const subscriptions = paginatedWindow.items;

		return {
			subscriptions,
			nextCursor: paginatedWindow.nextCursor,
			hasNextPage: paginatedWindow.hasNextPage,
		};
	}

	async getActiveSubscriptions(userId: string): Promise<SubscriptionDomain[]> {
		return this.subscriptionRepository.findActiveByUserId(userId);
	}

	async getSubscriptionById(
		id: string,
		userId: string,
	): Promise<SubscriptionDomain> {
		const subscription = await this.subscriptionRepository.findById(id);

		if (!subscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No subscription found with ID ${id}.`,
				},
			});
		}

		if (subscription.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to access this subscription.',
				instance: `/subscriptions/${id}`,
			});
		}

		return subscription;
	}

	async createSubscription(
		data: CreateSubscriptionInput,
		authUser: JWTPayload,
	): Promise<SubscriptionDomain> {
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
				detail: 'Category does not belong to the user.',
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
		return newSubscription;
	}

	async updateSubscription(
		id: string,
		data: UpdateSubscriptionData,
		userId: string,
	): Promise<SubscriptionDomain> {
		const existingSubscription = await this.subscriptionRepository.findById(id);
		if (!existingSubscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No subscription found with ID ${id}.`,
				},
			});
		}

		if (existingSubscription.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to modify this subscription.',
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
					detail: 'Category does not belong to the user.',
					instance: `/subscriptions/${id}`,
				});
			}
		}

		const subscriptionData: UpdateSubscriptionData = {
			...data,
		};

		const subscription = await this.subscriptionRepository.update(
			id,
			subscriptionData,
		);

		return subscription;
	}

	async updateSubscriptionStatus(
		id: string,
		data: UpdateSubscriptionStatusData,
		userId: string,
	): Promise<SubscriptionDomain> {
		const existingSubscription = await this.subscriptionRepository.findById(id);
		if (!existingSubscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No subscription found with ID ${id}.`,
				},
			});
		}

		if (existingSubscription.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to modify this subscription.',
			});
		}

		if (existingSubscription.status === 'CANCELLED') {
			throw conflictError({
				detail: 'Subscription is cancelled and cannot be updated.',
				identifier: `/subscriptions/${id}`,
			});
		}

		const subscription = await this.subscriptionRepository.update(id, {
			...data,
			...(data.status === 'ACTIVE' && { resumedAt: new Date() }),
		});

		return subscription;
	}

	async deleteSubscription(
		id: string,
		userId: string,
	): Promise<SubscriptionDomain> {
		const existingSubscription = await this.subscriptionRepository.findById(id);

		if (!existingSubscription) {
			throw notFoundError({
				resource: 'Subscription',
				identifier: id,
				extensions: {
					detail: `No subscription found with ID ${id}.`,
				},
			});
		}

		if (existingSubscription.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to delete this subscription.',
			});
		}

		const deletedSubscription = await this.subscriptionRepository.delete(id);
		return deletedSubscription;
	}
}
