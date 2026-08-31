import type {
	NON_DAILY_UNITS,
	StatusSubscription,
} from '@/shared/types/domain.enums.js';

export type NonDailyBillingUnit = (typeof NON_DAILY_UNITS)[number];

export interface CategoryExpense {
	category: string;
	amount: number;
	percentage: number;
}

export interface ExpensesByCategory {
	currency: string;
	totalExpenses: number;
	breakdown: CategoryExpense[];
}

export interface ExpensesByCategoryQuery {
	status?: StatusSubscription;
	billingUnit?: NonDailyBillingUnit;
}

export interface PaymentTimelineEntry {
	subscriptionName: string;
	category: string;
	amount: number;
	currency: string;
	date: string; // ISO string
}
