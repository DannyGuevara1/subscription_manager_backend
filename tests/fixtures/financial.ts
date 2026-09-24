import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';

export const REFERENCE_DATE = new Date('2026-09-23T12:00:00Z');
export const RATES_TO_USD = { USD: 1, EUR: 1.08, GBP: 1.25 };
export const financialSubscription = (
	overrides: Partial<SubscriptionDomain> = {},
): SubscriptionDomain => ({
	id: '00000000-0000-4000-8000-000000000001',
	userId: '00000000-0000-4000-8000-000000000010',
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Streaming',
	cost: 15.99,
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	firstPaymentDate: new Date('2026-01-01T12:00:00Z'),
	trialEndsOn: null,
	resumedAt: null,
	status: 'ACTIVE',
	...overrides,
});

export function financialPortfolio(): SubscriptionDomain[] {
	return [
		financialSubscription(),
		financialSubscription({
			name: 'Family',
			cost: 199.99,
			billingUnit: 'YEARS',
		}),
		financialSubscription({ name: 'Gym', cost: 12, billingUnit: 'WEEKS' }),
		financialSubscription({
			name: 'Domain',
			cost: 24,
			billingUnit: 'YEARS',
			billingFrequency: 2,
		}),
		financialSubscription({
			name: 'Trial',
			cost: 10,
			trialEndsOn: new Date('2026-10-03T12:00:00Z'),
		}),
		financialSubscription({ name: 'Resumable', cost: 8, status: 'PAUSED' }),
		financialSubscription({ name: 'Cancelled', cost: 9, status: 'CANCELLED' }),
		financialSubscription({ name: 'Euro streaming', currencyCode: 'EUR' }),
		financialSubscription({ name: 'Cloud', cost: 30, costType: 'VARIABLE' }),
	].map((sub, i) => ({
		...sub,
		id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
	}));
}

// 15.99 + 199.99/12 + 12*52/12 + 24/24 + 10 + 15.99*1.08 + 30.
// Round only at the response boundary, never monthly before annualization.
export const PORTFOLIO_ORACLE = {
	projectedMonthly: '142.93',
	currentMonthly: '132.93',
	projectedAnnual: '1715.10',
	currentAnnual: '1595.10',
	// Analytics preserves amounts per charge, including trial: 15.99+199.99+12+24+10+17.2692+30.
	perCharge: 309.25,
};
