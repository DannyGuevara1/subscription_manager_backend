import type {
	BillingUnit,
	CostType,
	Prisma,
	Subscription,
} from '@prisma/client';
// export interface Subscription {
// 	id: string;
// 	userId: string;
// 	categoryId: number;
// 	currencyCode: string;
// 	name: string;
// 	cost: number;
// 	costType: CostType;
// 	billingFrequency: number;
// 	billingUnit: BillingUnit;
// 	firstPaymentDate: Date;
// 	trialEndsOn?: Date;
// }

export interface CreateSubscriptionData {
	id: string;
	userId: string;
	categoryId: number;
	currencyCode: string;
	name: string;
	cost: Prisma.Decimal | number;
	costType: CostType;
	billingFrequency: number;
	billingUnit: BillingUnit;
	firstPaymentDate: Date;
	trialEndsOn?: Date;
}

export interface UpdateSubscriptionData {
	categoryId?: number;
	currencyCode?: string;
	name?: string;
	cost?: Prisma.Decimal | number;
	costType?: CostType;
	billingFrequency?: number;
	billingUnit?: BillingUnit;
	firstPaymentDate?: Date;
	trialEndsOn?: Date;
}

export type SafeSubscription = Omit<Subscription, 'createdAt' | 'updatedAt'>;
