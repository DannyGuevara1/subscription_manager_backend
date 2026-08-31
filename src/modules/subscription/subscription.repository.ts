import type { Subscription } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	CreateSubscriptionData,
	SubscriptionCursorPaginationOptions,
	SubscriptionCursorPaginationResult,
	SubscriptionDomain,
	UpdateSubscriptionData,
	UpdateSubscriptionStatusData,
} from '@/modules/subscription/subscription.type.js';

export default class SubscriptionRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	private toDomain(subscription: Subscription): SubscriptionDomain {
		return {
			id: subscription.id,
			userId: subscription.userId,
			categoryId: subscription.categoryId,
			currencyCode: subscription.currencyCode,
			name: subscription.name,
			cost: Number(subscription.cost.toFixed(2)),
			costType: subscription.costType,
			billingFrequency: subscription.billingFrequency,
			billingUnit: subscription.billingUnit,
			status: subscription.status,
			firstPaymentDate: subscription.firstPaymentDate,
			trialEndsOn: subscription.trialEndsOn,
			resumedAt: subscription.resumedAt,
		};
	}

	async findAllWithCursor(
		userId: string,
		options: SubscriptionCursorPaginationOptions,
	): Promise<SubscriptionCursorPaginationResult> {
		const { cursor, limit, categoryId, billingCycle, status } = options;

		const subscriptions = await this.prisma.subscription.findMany({
			where: {
				userId,
				...(categoryId && { categoryId: categoryId }),
				...(billingCycle && { billingUnit: billingCycle }),
				...(status && { status: status }),
			},
			orderBy: { id: 'desc' },
			take: limit,
			...(cursor
				? {
						cursor: { id: cursor },
						skip: 1,
					}
				: {}),
		});

		return {
			subscriptions: subscriptions.map((subscription) =>
				this.toDomain(subscription),
			),
		};
	}

	async findById(id: string): Promise<SubscriptionDomain | null> {
		const subscription = await this.prisma.subscription.findUnique({
			where: { id },
		});

		if (!subscription) {
			return null;
		}

		return this.toDomain(subscription);
	}

	async create(data: CreateSubscriptionData): Promise<SubscriptionDomain> {
		const subscription = await this.prisma.subscription.create({
			data,
		});

		return this.toDomain(subscription);
	}

	async update(
		id: string,
		data: Partial<UpdateSubscriptionData | UpdateSubscriptionStatusData>,
	): Promise<SubscriptionDomain> {
		const subscription = await this.prisma.subscription.update({
			where: { id },
			data,
		});

		return this.toDomain(subscription);
	}

	async delete(id: string): Promise<SubscriptionDomain> {
		const subscription = await this.prisma.subscription.delete({
			where: { id },
		});

		return this.toDomain(subscription);
	}

	async findActiveByUserId(userId: string): Promise<SubscriptionDomain[]> {
		const subscriptions = await this.prisma.subscription.findMany({
			where: {
				userId,
				status: 'ACTIVE',
			},
			orderBy: { createdAt: 'desc' },
		});

		return subscriptions.map((subscription) => this.toDomain(subscription));
	}
}
