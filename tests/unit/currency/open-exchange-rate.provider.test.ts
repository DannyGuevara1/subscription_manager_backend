import { it } from 'node:test';
import assert from 'node:assert/strict';
import Provider from '@/modules/currency/adapters/open-exchange-rate.provider.js';

it('keeps provider bulk quotes USD-based while direct conversion returns USD per EUR', async (t) => {
	const fetch = t.mock.method(
		globalThis,
		'fetch',
		async (_url: unknown, options?: RequestInit) => {
			assert.ok(options?.signal);
			return new Response(
				JSON.stringify({ base: 'USD', rates: { USD: 1, EUR: 0.8 } }),
			);
		},
	);
	const provider = new Provider('test-only');
	assert.deepEqual(await provider.getAllRates(), { USD: 1, EUR: 0.8 });
	assert.equal(await provider.getRate('EUR', 'USD'), 1.25);
	assert.equal(fetch.mock.callCount(), 2);
});
it('rejects invalid provider payloads and HTTP failures', async (t) => {
	const stub = t.mock.method(
		globalThis,
		'fetch',
		async () => new Response('{}', { status: 503 }),
	);
	const provider = new Provider('test-only');
	await assert.rejects(provider.getAllRates());
	for (const payload of [
		{ base: 'EUR', rates: { USD: 1 } },
		{ base: 'USD', rates: { USD: 1, EUR: 0 } },
		{ base: 'USD' },
	]) {
		stub.mock.mockImplementation(
			async () => new Response(JSON.stringify(payload)),
		);
		await assert.rejects(provider.getAllRates());
	}
});
