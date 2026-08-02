import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

// Stub: tasas fijas, sin HTTP. 1 sola llamada bulk como hace OXR.
const stubProvider: ExchangeRateProvider = {
	getRate: async () => 1,
	getAllRates: async () => ({ USD: 1, EUR: 0.92 }),
};

const failingProvider: ExchangeRateProvider = {
	getRate: async () => 1,
	getAllRates: async () => {
		throw new Error('OXR caído');
	},
};

describe('Currency Updater Job - Integración', () => {
	const env = setupIntegrationEnvironment();

	// OJO: imports dinámicos. Importar módulos de la app a nivel top cargaría
	// el singleton de Prisma ANTES de que el setup apunte DATABASE_URL al
	// testcontainer, y los tests correrían contra la DB local.
	let Service: typeof ExchangeRateService;
	let Repository: typeof CurrencyRepository;

	before(async () => {
		Service = (await import('@/modules/currency/exchange-rate.service.js'))
			.default;
		Repository = (await import('@/modules/currency/currency.repository.js'))
			.default;
	});

	it('updateAllRates actualiza tasa y rateUpdatedAt de todas las monedas en DB', async () => {
		const prisma = env.getPrismaClient();
		const service = new Service(stubProvider, new Repository(prisma));

		// Forzamos una tasa vieja para comprobar que el job la pisa
		const staleDate = new Date('2020-01-01T00:00:00Z');
		await prisma.currency.update({
			where: { code: 'EUR' },
			data: { exchangeRateToUSD: 0.5, rateUpdatedAt: staleDate },
		});

		const updated = await service.updateAllRates();
		assert.ok(
			updated >= 2,
			`Debería actualizar al menos 2 monedas, actualizó ${updated}`,
		);

		const eur = await prisma.currency.findUnique({ where: { code: 'EUR' } });
		assert.strictEqual(Number(eur.exchangeRateToUSD), 0.92);
		assert.ok(
			eur.rateUpdatedAt > staleDate,
			'rateUpdatedAt debe refrescarse tras el job',
		);

		const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
		assert.strictEqual(Number(usd.exchangeRateToUSD), 1);
	});

	it('updateAllRates devuelve 0 sin lanzar si el provider falla', async () => {
		const service = new Service(
			failingProvider,
			new Repository(env.getPrismaClient()),
		);

		const updated = await service.updateAllRates();
		assert.strictEqual(updated, 0);
	});
});
