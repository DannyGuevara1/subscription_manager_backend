import type { Subscription } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	AnnualSubscriptionRawData,
	CreateSubscriptionData,
	DailySubscriptionRawData,
	MonthlySubscriptionRawData,
	SubscriptionCursorPaginationOptions,
	SubscriptionCursorPaginationResult,
	SubscriptionDomain,
	UpdateSubscriptionData,
	WeekSubscriptionRawData,
} from '@/modules/subscription/subscription.type.js';
import type { BillingUnit } from '@/shared/types/domain.enums.js';

export default class SubscriptionRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	private async getActiveFixedSubscriptionsByBillingUnit<
		BillingUnitValue extends BillingUnit,
	>(
		userId: string,
		billingUnit: BillingUnitValue,
	): Promise<
		Array<{
			cost: string;
			billingFrequency: number;
			billingUnit: BillingUnitValue;
		}>
	> {
		const result = await this.prisma.subscription.findMany({
			where: {
				userId,
				costType: 'FIXED',
				billingUnit,
				isActive: true,
			},
			select: {
				cost: true,
				billingFrequency: true,
			},
		});

		return result.map((subscription) => ({
			cost: subscription.cost.toFixed(2),
			billingFrequency: subscription.billingFrequency,
			billingUnit,
		}));
	}

	private toDomain(subscription: Subscription): SubscriptionDomain {
		return {
			id: subscription.id,
			userId: subscription.userId,
			categoryId: subscription.categoryId,
			currencyCode: subscription.currencyCode,
			name: subscription.name,
			cost: subscription.cost.toFixed(2),
			costType: subscription.costType,
			billingFrequency: subscription.billingFrequency,
			billingUnit: subscription.billingUnit,
			isActive: subscription.isActive,
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

	async findAllWithCursor(
		userId: string,
		options: SubscriptionCursorPaginationOptions,
	): Promise<SubscriptionCursorPaginationResult> {
		const { cursor, limit } = options;

		const subscriptions = await this.prisma.subscription.findMany({
			where: {
				userId,
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

	async getTotalMonthlySubscriptions(
		userId: string,
	): Promise<MonthlySubscriptionRawData[]> {
		return this.getActiveFixedSubscriptionsByBillingUnit(userId, 'MONTHS');
	}

	async getTotalAnnualSubscriptions(
		userId: string,
	): Promise<AnnualSubscriptionRawData[]> {
		return this.getActiveFixedSubscriptionsByBillingUnit(userId, 'YEARS');
	}

	async getTotalDailySubscriptions(
		userId: string,
	): Promise<DailySubscriptionRawData[]> {
		return this.getActiveFixedSubscriptionsByBillingUnit(userId, 'DAYS');
	}

	async getTotalWeeklySubscriptions(
		userId: string,
	): Promise<WeekSubscriptionRawData[]> {
		return this.getActiveFixedSubscriptionsByBillingUnit(userId, 'WEEKS');
	}

	async findActiveByUserId(userId: string): Promise<SubscriptionDomain[]> {
		const subscriptions = await this.prisma.subscription.findMany({
			where: {
				userId,
				isActive: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return subscriptions.map((subscription) => this.toDomain(subscription));
	}
}
