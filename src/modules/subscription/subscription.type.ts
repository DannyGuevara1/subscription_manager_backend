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
	cost: number;
	costType: CostType;
	billingFrequency: number;
	billingUnit: BillingUnit;
	firstPaymentDate: Date;
	trialEndsOn?: Date | null;
}
