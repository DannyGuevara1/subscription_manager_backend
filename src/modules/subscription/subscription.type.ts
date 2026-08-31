import type {
	BillingUnit,
	CostType,
	StatusSubscription,
} from '@/shared/types/domain.enums.js';

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
	trialEndsOn?: Date;
}

export interface UpdateSubscriptionStatusData {
	status: StatusSubscription;
}

export interface SubscriptionDomain {
	id: string;
	userId: string;
	categoryId: number;
	currencyCode: string;
	name: string;
	cost: number;
	costType: CostType;
	billingFrequency: number;
	billingUnit: BillingUnit;
	status: StatusSubscription;
	firstPaymentDate: Date;
	resumedAt?: Date | null;
	trialEndsOn?: Date | null;
}

export interface SubscriptionCursorPaginationOptions {
	cursor?: string;
	limit: number;
	categoryId?: number;
	billingCycle?: BillingUnit;
	status?: StatusSubscription;
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

export interface NextPaymentInfo {
	nextPaymentDate: Date;
	subscriptionId: string;
	subscriptionName: string;
	amount: number;
}
export interface CalculatorConfig {
	firstPaymentDate: Date;
	billingFrequency: number;
	billingUnit: BillingUnit;
	trialEndsOn?: Date | null;
	referenceDate?: Date;
}

export interface ProjectionConfig extends CalculatorConfig {
	endDate: Date;
}

export interface SubscriptionDateCalculator {
	nextPaymentDate(config: CalculatorConfig): Date;
	projectNextPaymentDates(config: ProjectionConfig): Date[];
}
