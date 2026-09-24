import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import {
	financialSubscription,
	financialPortfolio,
	REFERENCE_DATE,
	RATES_TO_USD,
	PORTFOLIO_ORACLE,
} from '../../fixtures/financial.js';

const normalizer = () =>
	new SubscriptionCostNormalizerService({
		getRatesToUSD: async () => new Map(Object.entries(RATES_TO_USD)),
	});

describe('Financial normalization oracle', () => {
	for (const [unit, cost, frequency, monthly, annual] of [
		['DAYS', 6, 2, '91.25', '1095.00'], // $6 every two days: $3/day *365.
		['WEEKS', 50, 2, '108.33', '1300.00'], // $50 every two weeks: 26 charges/year.
		['MONTHS', 30, 3, '10.00', '120.00'], // $30 per quarter.
		['YEARS', 24, 2, '1.00', '12.00'], // $24 domain every two years.
	] as const) {
		it(`divides the ${unit} interval instead of multiplying`, async () => {
			const result = await normalizer().normalizeAll(
				[
					financialSubscription({
						cost,
						billingFrequency: frequency,
						billingUnit: unit,
					}),
				],
				'USD',
			);
			assert.equal(result.totalMonthly, monthly);
			assert.equal(result.totalAnnual, annual);
		});
	}
	it('freezes the shared portfolio and trial boundaries', async (t) => {
		t.mock.timers.enable({ apis: ['Date'], now: REFERENCE_DATE });
		const result = await normalizer().normalizeAll(
			financialPortfolio().filter((s) => s.status === 'ACTIVE'),
			'USD',
		);
		for (const key of [
			'projectedMonthly',
			'currentMonthly',
			'projectedAnnual',
			'currentAnnual',
		] as const) {
			assert.equal(result[key], PORTFOLIO_ORACLE[key]);
		}
		const expired = await normalizer().normalize(
			financialSubscription({ cost: 10, trialEndsOn: REFERENCE_DATE }),
			'USD',
		);
		assert.equal(expired.currentMonthly, 10);
	});
	it('converts EUR to GBP through USD using independently calculated values', async () => {
		// EUR 25 * 1.08 USD/EUR / 1.25 USD/GBP = GBP 21.60.
		const result = await normalizer().normalize(
			financialSubscription({ cost: 25, currencyCode: 'EUR' }),
			'GBP',
		);
		assert.equal(result.projectedMonthly, 21.6);
	});
	it('returns zero totals for empty and zero-cost subscriptions', async () => {
		assert.equal(
			(await normalizer().normalizeAll([], 'USD')).totalAnnual,
			'0.00',
		);
		assert.equal(
			(
				await normalizer().normalizeAll(
					[financialSubscription({ cost: 0 })],
					'USD',
				)
			).totalMonthly,
			'0.00',
		);
	});
	it('reads the portfolio rates only once', async () => {
		let reads = 0;
		const service = new SubscriptionCostNormalizerService({
			getRatesToUSD: async () => {
				reads++;
				return new Map(Object.entries(RATES_TO_USD));
			},
		});
		await service.normalizeAll(
			Array.from({ length: 10 }, () =>
				financialSubscription({ currencyCode: 'EUR' }),
			),
			'USD',
		);
		assert.equal(reads, 1);
	});
});
