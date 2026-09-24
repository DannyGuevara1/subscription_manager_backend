import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Deployment currency initialization', () => {
	const env = setupIntegrationEnvironment();
	it('repairs old quote direction atomically, preserves users and aborts incomplete quotes', async () => {
		const prisma = env.getPrismaClient();
		const users = await prisma.user.count();
		const execute = (rates: Record<string, number>) =>
			spawnSync(
				process.execPath,
				[
					'--import',
					'tsx',
					'--import',
					'./tests/fixtures/exchange-provider-hook.mjs',
					'src/operations/refresh-currencies.ts',
				],
				{
					env: {
						...process.env,
						APP_ID_OPENEXCHANGERATES: 'test-only',
						TEST_PROVIDER_RATES: JSON.stringify(rates),
					},
					encoding: 'utf8',
				},
			);
		const success = execute({ USD: 1, EUR: 0.8 });
		assert.equal(success.status, 0, success.stderr);
		const before = await prisma.currency.findMany({ orderBy: { code: 'asc' } });
		assert.equal(
			Number(
				before.find((c: { code: string }) => c.code === 'EUR')
					.exchangeRateToUSD,
			),
			1.25,
		);
		const failure = execute({ USD: 1 });
		assert.notEqual(failure.status, 0);
		assert.deepEqual(
			await prisma.currency.findMany({ orderBy: { code: 'asc' } }),
			before,
		);
		assert.equal(await prisma.user.count(), users);
		await prisma.currency.create({
			data: {
				code: 'VND',
				name: 'Vietnamese Dong',
				symbol: '₫',
				exchangeRateToUSD: 0.00004,
				rateUpdatedAt: new Date(),
			},
		});
		const small = execute({ USD: 1, EUR: 0.8, VND: 25000 });
		assert.equal(small.status, 0, small.stderr);
		const vnd = await prisma.currency.findUniqueOrThrow({
			where: { code: 'VND' },
		});
		assert.equal(Number(vnd.exchangeRateToUSD), 0.00004); // 1/25000 must not round to zero.
	});
});
