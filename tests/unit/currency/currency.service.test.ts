import assert from 'node:assert';
import { describe, it } from 'node:test';
import CurrencyService from '@/modules/currency/currency.service.js';

const createFixture = () => {
	const calls = {
		findByCode: [] as string[],
	};

	const currencyRepository = {
		findByCode: async (code: string) => {
			calls.findByCode.push(code);
			return {
				code,
				name: 'US Dollar',
				symbol: '$',
				createdAt: new Date('2026-01-01T00:00:00.000Z'),
				updatedAt: new Date('2026-01-01T00:00:00.000Z'),
			};
		},
	} as any;

	const service = new CurrencyService(currencyRepository);

	return {
		service,
		currencyRepository,
		calls,
	};
};

describe('Currency Service', () => {
	it('getCurrencyByCode retorna notFound cuando el codigo no existe.', async () => {
		const fixture = createFixture();

		fixture.currencyRepository.findByCode = async (code: string) => {
			fixture.calls.findByCode.push(code);
			return null;
		};

		await assert.rejects(
			() => fixture.service.getCurrencyByCode('ZZZ'),
			(error: unknown) => {
				assert.strictEqual((error as { status?: number }).status, 404);
				return true;
			},
		);

		assert.deepStrictEqual(fixture.calls.findByCode, ['ZZZ']);
	});
});
