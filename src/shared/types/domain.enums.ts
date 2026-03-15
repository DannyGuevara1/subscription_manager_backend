export const COST_TYPE_VALUES = ['FIXED', 'VARIABLE'] as const;
export type CostType = (typeof COST_TYPE_VALUES)[number];

export const BILLING_UNIT_VALUES = [
	'DAYS',
	'WEEKS',
	'MONTHS',
	'YEARS',
] as const;
export type BillingUnit = (typeof BILLING_UNIT_VALUES)[number];

export const ROLE_VALUES = ['USER', 'ADMIN', 'SUPPORT'] as const;
export type Role = (typeof ROLE_VALUES)[number];
