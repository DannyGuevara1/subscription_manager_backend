export const COST_TYPE_VALUES = ['FIXED', 'VARIABLE'] as const;
export type CostType = (typeof COST_TYPE_VALUES)[number];

export const NON_DAILY_UNITS = ['WEEKS', 'MONTHS', 'YEARS'] as const;

export const BILLING_UNIT_VALUES = ['DAYS', ...NON_DAILY_UNITS] as const;

export type BillingUnit = (typeof BILLING_UNIT_VALUES)[number];

export const ROLE_VALUES = ['USER', 'ADMIN', 'SUPPORT'] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const STATUS_SUBSCRIPTION_VALUES = [
	'PAUSED',
	'ACTIVE',
	'CANCELLED',
] as const;
export type StatusSubscription = (typeof STATUS_SUBSCRIPTION_VALUES)[number];
