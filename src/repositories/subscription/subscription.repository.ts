import type { Subscription } from '@prisma/client';
import type {
	CreateSubscriptionData,
	UpdateSubscriptionData,
} from '@/api/components/subscription/subscription.type.js';
import prismaClient from '@/config/prisma.js';

export default class SubscriptionRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	async findAll(): Promise<Subscription[]> {
		return this.prisma.subscription.findMany({
			orderBy: { createdAt: 'desc' },
		});
	}

	async findById(id: string): Promise<Subscription | null> {
		return this.prisma.subscription.findUnique({
			where: { id },
		});
	}

	async create(data: CreateSubscriptionData): Promise<Subscription> {
		return this.prisma.subscription.create({
			data,
		});
	}

	async update(
		id: string,
		data: Partial<UpdateSubscriptionData>,
	): Promise<Subscription> {
		return this.prisma.subscription.update({
			where: { id },
			data,
		});
	}

	async delete(id: string): Promise<Subscription> {
		return this.prisma.subscription.delete({
			where: { id },
		});
	}
}
