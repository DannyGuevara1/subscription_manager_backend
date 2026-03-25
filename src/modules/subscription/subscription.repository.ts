import type { Subscription } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	CreateSubscriptionData,
	SubscriptionDomain,
	UpdateSubscriptionData,
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
			cost: Number(subscription.cost),
			costType: subscription.costType,
			billingFrequency: subscription.billingFrequency,
			billingUnit: subscription.billingUnit,
			firstPaymentDate: subscription.firstPaymentDate,
			trialEndsOn: subscription.trialEndsOn,
		};
	}

	async findAll(userId: string): Promise<SubscriptionDomain[]> {
		const subscriptions = await this.prisma.subscription.findMany({
			where: {
				userId,
			},
			orderBy: { createdAt: 'desc' },
		});

		return subscriptions.map((subscription) => this.toDomain(subscription));
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
		data: Partial<UpdateSubscriptionData>,
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
}
