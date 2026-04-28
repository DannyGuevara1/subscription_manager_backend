import type { BillingUnit, CostType } from '@/shared/types/domain.enums.js';

export interface CreateSubscriptionData {
	id: string;
	userId: string;
	categoryId: number;
	currencyCode: string;
	name: string;
	cost: number;
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
	cost?: number;
	costType?: CostType;
	billingFrequency?: number;
	billingUnit?: BillingUnit;
	firstPaymentDate?: Date;
	trialEndsOn?: Date;
}

export interface SubscriptionDomain {
	id: string;
	userId: string;
	categoryId: number;
	currencyCode: string;
	name: string;
	cost: string;
	costType: CostType;
	billingFrequency: number;
	billingUnit: BillingUnit;
	isActive: boolean;
	firstPaymentDate: Date;
	trialEndsOn?: Date | null;
}

export interface SubscriptionCursorPaginationOptions {
	cursor?: string;
	limit: number;
}

export interface SubscriptionCursorPaginationResult {
	subscriptions: SubscriptionDomain[];
}

export interface SubscriptionCursorPaginationPage {
	subscriptions: SubscriptionDomain[];
	nextCursor: string | null;
	hasNextPage: boolean;
}

export type CreateSubscriptionInput = Omit<
	CreateSubscriptionData,
	'id' | 'userId'
>;

type SubscriptionCostRawData = {
	cost: string;
	billingFrequency: number;
};

export type MonthlySubscriptionRawData = SubscriptionCostRawData & {
	billingUnit: 'MONTHS';
};
export type AnnualSubscriptionRawData = SubscriptionCostRawData & {
	billingUnit: 'YEARS';
};
export type DailySubscriptionRawData = SubscriptionCostRawData & {
	billingUnit: 'DAYS';
};
export type WeekSubscriptionRawData = SubscriptionCostRawData & {
	billingUnit: 'WEEKS';
};
