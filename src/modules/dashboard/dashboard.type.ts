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

export interface NormalizedSubscriptionCost {
	/** Costo mensual equivalente (projected = costo real siempre) */
	projectedMonthly: number;
	/** Costo anual equivalente (projected) */
	projectedAnnual: number;
	/** Costo mensual HOY (0 si está en trial, sino = projectedMonthly) */
	currentMonthly: number;
	/** Costo anual HOY (0 si está en trial, sino = projectedAnnual) */
	currentAnnual: number;
	/** La unidad de facturación original — para agrupar en expensesByType */
	billingUnit: BillingUnit;
}
