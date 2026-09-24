import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import type { CurrencyDomain } from '@/modules/currency/currency.type.js';

function fixture(overrides: Partial<CurrencyDomain> = {}) {
	const currency = {
		code: 'EUR',
		name: 'Euro',
		symbol: '€',
		exchangeRateToUSD: 1.25,
		rateUpdatedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
	const provider = {
		getRate: mock.fn(async () => 1.25),
		getAllRates: mock.fn(
			async (): Promise<Record<string, number>> => ({ USD: 1, EUR: 0.8 }),
		),
	};
	const repo = {
		findByCodes: mock.fn(async (_codes: string[]) => [currency]),
		findAll: mock.fn(async () => [currency]),
		update: mock.fn(async () => currency),
	};
	return {
		service: new ExchangeRateService(
			provider,
			repo as unknown as CurrencyRepository,
		),
		provider,
		repo,
	};
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('ExchangeRateService', () => {
	it('USD and empty portfolios need no database', async () => {
		const { service, repo } = fixture();
		assert.equal(await service.getRateToUSD('USD'), 1);
		await service.getRatesToUSD([]);
		assert.equal(repo.findByCodes.mock.callCount(), 0);
	});
	it('deduplicates currencies into one fresh DB snapshot without HTTP', async () => {
		const { service, repo, provider } = fixture();
		assert.equal(
			(await service.getRatesToUSD(['EUR', 'EUR', 'USD'])).get('EUR'),
			1.25,
		);
		assert.deepEqual(repo.findByCodes.mock.calls[0]?.arguments, [['EUR']]);
		assert.equal(provider.getRate.mock.callCount(), 0);
	});
	it('serves stale rates, coalesces concurrent refreshes, then allows another refresh', async () => {
		const { service, provider, repo } = fixture({ rateUpdatedAt: new Date(0) });
		let resolve!: (rate: number) => void;
		provider.getRate.mock.mockImplementation(
			() =>
				new Promise<number>((r) => {
					resolve = r;
				}),
		);
		assert.deepEqual(
			await Promise.all([
				service.getRateToUSD('EUR'),
				service.getRateToUSD('EUR'),
			]),
			[1.25, 1.25],
		);
		assert.equal(provider.getRate.mock.callCount(), 1);
		resolve(1.3);
		await flush();
		assert.equal(repo.update.mock.callCount(), 1);
		await service.getRateToUSD('EUR');
		assert.equal(provider.getRate.mock.callCount(), 2);
		resolve(1.3);
		await flush();
	});
	it('does not fail a cached response if refresh fails', async () => {
		const { service, provider } = fixture({ rateUpdatedAt: new Date(0) });
		provider.getRate.mock.mockImplementation(async () => {
			throw new Error('offline');
		});
		assert.equal(await service.getRateToUSD('EUR'), 1.25);
		await flush();
	});
	it('rejects missing currencies instead of inventing parity', async () => {
		await assert.rejects(fixture().service.getRateToUSD('GBP'), {
			status: 404,
		});
	});
	for (const rate of [0, -1, NaN, Infinity]) {
		it(`rejects invalid stored rate ${rate}`, async () => {
			await assert.rejects(
				fixture({ exchangeRateToUSD: rate }).service.getRateToUSD('EUR'),
			);
		});
	}
	it('bulk stores the reciprocal, skips absent quotes and matches point conversion', async () => {
		const { service, repo } = fixture();
		assert.equal(await service.updateAllRates(), 1);
		const args = repo.update.mock.calls[0]!.arguments as unknown as [
			string,
			{ exchangeRateToUSD: number },
		];
		assert.equal(args[1].exchangeRateToUSD, 1.25); // 1 USD = 0.8 EUR => 1 EUR = 1.25 USD.
		const missing = fixture({ code: 'GBP' });
		assert.equal(await missing.service.updateAllRates(), 0);
		assert.equal(missing.repo.update.mock.callCount(), 0);
	});
	it('bulk failure leaves stored rates intact', async () => {
		const { service, provider, repo } = fixture();
		provider.getAllRates.mock.mockImplementation(async () => {
			throw new Error('offline');
		});
		assert.equal(await service.updateAllRates(), 0);
		assert.equal(repo.update.mock.callCount(), 0);
	});
	it('invalid bulk and background quotes are never persisted', async () => {
		const { service, provider, repo } = fixture({ rateUpdatedAt: new Date(0) });
		provider.getAllRates.mock.mockImplementation(async () => ({ EUR: 0 }));
		assert.equal(await service.updateAllRates(), 0);
		provider.getRate.mock.mockImplementation(async () => 0);
		await service.getRateToUSD('EUR');
		await flush();
		assert.equal(repo.update.mock.callCount(), 0);
	});
});
