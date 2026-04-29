import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { ExchangeRateProvider } from '@/modules/dashboard/ports/exchange-rate.provider.js';
import SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';

const sameCurrencyProvider: ExchangeRateProvider = {
	async getRate(from: string, to: string) {
		if (from !== to) throw new Error('Currency mismatch');
		return 1;
	},
};

const createNormalizer = () =>
	new SubscriptionCostNormalizerService(sameCurrencyProvider);

const makeSubscription = (
	overrides: Partial<SubscriptionDomain> = {},
): SubscriptionDomain => ({
	id: 'sub-1',
	userId: 'user-1',
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Test Sub',
	cost: '10.00',
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	firstPaymentDate: new Date('2026-01-01'),
	trialEndsOn: null,
	isActive: true,
	...overrides,
});

describe('SubscriptionCostNormalizerService', () => {
	describe('DAYS normalization', () => {
		it('calcula mensual equivalente para DAYS: ((cost * freq) * 365) / 12', async () => {
			const normalizer = createNormalizer();
			const sub = makeSubscription({
				cost: '10.00',
				billingFrequency: 1,
				billingUnit: 'DAYS',
			});
			// ((10 * 1) * 365) / 12 = 304.17
			const result = await normalizer.normalizeAll([sub], 'USD');
			assert.strictEqual(result.totalMonthly, '304.17');
			assert.strictEqual(result.totalAnnual, '3650.04');
		});
	});

	describe('WEEKS normalization', () => {
		it('calcula mensual equivalente para WEEKS: ((cost * freq) * 52) / 12', async () => {
			const normalizer = createNormalizer();
			const sub = makeSubscription({
				cost: '50.00',
				billingFrequency: 2,
				billingUnit: 'WEEKS',
			});
			// ((50 * 2) * 52) / 12 = 433.33
			const result = await normalizer.normalizeAll([sub], 'USD');
			assert.strictEqual(result.totalMonthly, '433.33');
			assert.strictEqual(result.totalAnnual, '5199.96');
		});
	});

	describe('MONTHS normalization', () => {
		it('calcula mensual equivalente para MONTHS: cost * freq', async () => {
			const normalizer = createNormalizer();
			const sub = makeSubscription({
				cost: '15.99',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
			});
			const result = await normalizer.normalizeAll([sub], 'USD');
			assert.strictEqual(result.totalMonthly, '15.99');
			assert.strictEqual(result.totalAnnual, '191.88');
		});
	});

	describe('YEARS normalization', () => {
		it('calcula mensual equivalente para YEARS: (cost * freq) / 12', async () => {
			const normalizer = createNormalizer();
			const sub = makeSubscription({
				cost: '120.00',
				billingFrequency: 1,
				billingUnit: 'YEARS',
			});
		});
	});
});
