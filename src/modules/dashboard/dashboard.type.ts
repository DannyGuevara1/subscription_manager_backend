import type { BillingUnit } from '@/shared/types/domain.enums.js';
export interface DashboardSummary {
	totalMonthly: string;
	totalAnnual: string;
	currentMonthly: string;
	currentAnnual: string;
	projectedMonthly: string;
	projectedAnnual: string;
	currencyCode: string;
	expensesByType: Record<BillingUnit, string>;
}
