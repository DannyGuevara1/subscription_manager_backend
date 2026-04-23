export interface DashboardSummary {
	totalMonthly: string;
	totalAnnual: string;
	currentMonthly: string;
	currentAnnual: string;
	projectedMonthly: string;
	projectedAnnual: string;
	currencyCode: string;
	expensesByType: {
		DAYS: string;
		WEEKS: string;
		MONTHS: string;
		YEARS: string;
	};
}
