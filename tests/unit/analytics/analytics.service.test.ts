import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type SubscriptionService from '@/modules/subscription/subscription.service.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';
import AnalyticsService from '@/modules/analytics/analytics.service.js';

// ── Fixtures ──

const AUTH_USER: JWTPayload = {
	sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
	email: 'user@example.com',
	name: 'Analytics User',
	role: 'USER',
	primaryCurrencyCode: 'USD',
};

const makeSubscription = (
	overrides: Partial<SubscriptionDomain> = {},
): SubscriptionDomain => ({
	id: 'sub-1',
	userId: AUTH_USER.sub,
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Spotify',
	cost: '10.00',
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	isActive: true,
	firstPaymentDate: new Date('2026-01-01T00:00:00Z'),
	trialEndsOn: null,
	...overrides,
});

const CATEGORIES: Record<number, string> = {
	1: 'Streaming',
	2: 'Productivity',
	3: 'Gaming',
};

// Rates → USD (e.g., 1 EUR = 1.10 USD, 1 ARS = 0.001 USD)
const RATES_TO_USD: Record<string, number> = {
	USD: 1,
	EUR: 1.1,
	ARS: 0.001,
};

const createFixture = (subscriptions: SubscriptionDomain[] = []) => {
	const subscriptionService = {
		getActiveSubscriptions: async () => subscriptions,
	} as unknown as SubscriptionService;

	const exchangeRateService = {
		getRateToUSD: async (code: string) => RATES_TO_USD[code] ?? 1,
	} as unknown as ExchangeRateService;

	const categoryService = {
		getCategoryById: async (id: number) => ({
			id,
			name: CATEGORIES[id] ?? `Category-${id}`,
			userId: AUTH_USER.sub,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		getCategoriesByIds: async (ids: number[], _userId: string) => {
			const map = new Map<number, string>();
			for (const id of ids) {
				map.set(id, CATEGORIES[id] ?? `Category-${id}`);
			}
			return map;
		},
	} as unknown as CategoryService;

	const subscriptionCalculatorService = {
		projectNextPaymentDates: ({ firstPaymentDate, endDate }: any) => {
			// Genera fechas mensuales desde firstPaymentDate hasta endDate
			const dates: Date[] = [];
			const current = new Date(firstPaymentDate);
			while (current <= endDate) {
				dates.push(new Date(current));
				current.setMonth(current.getMonth() + 1);
			}
			return dates;
		},
	} as unknown as SubscriptionCalculatorService;

	const service = new AnalyticsService(
		subscriptionService,
		exchangeRateService,
		subscriptionCalculatorService,
		categoryService,
	);

	return {
		service,
		subscriptionService,
		exchangeRateService,
		categoryService,
		subscriptionCalculatorService,
	};
};

// ── Tests: getExpensesByCategory ──

describe('AnalyticsService', () => {
	describe('getExpensesByCategory', () => {
		it('retorna currency del usuario, no hardcodeado USD', async () => {
			const authUser: JWTPayload = {
				...AUTH_USER,
				primaryCurrencyCode: 'EUR',
			};
			const fixture = createFixture([makeSubscription()]);

			const result = await fixture.service.getExpensesByCategory(
				authUser,
				{},
			);

			assert.strictEqual(result.currency, 'EUR');
		});

		it('normaliza costos al currency primario del usuario (two-step conversion)', async () => {
			// Sub en EUR, usuario con primary USD
			// cost=10 EUR, EUR→USD rate=1.10, USD→USD rate=1
			// costInPrimary = (10 * 1.10) / 1 = 11.00
			const fixture = createFixture([
				makeSubscription({ currencyCode: 'EUR', cost: '10.00' }),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{},
			);

			assert.strictEqual(result.currency, 'USD');
			assert.strictEqual(result.totalExpenses, 11);
			assert.strictEqual(result.breakdown[0]?.amount, 11);
			assert.strictEqual(result.breakdown[0]?.percentage, 100);
			assert.strictEqual(result.breakdown[0]?.category, 'Streaming');

		});

		it('normaliza costos al currency primario del usuario (EUR)', async () => {
			const authUser: JWTPayload = {
				...AUTH_USER,
				primaryCurrencyCode: 'EUR',
			};
			const fixture = createFixture([
				makeSubscription({ currencyCode: 'USD', cost: '10.00' }),
			]);

			const result = await fixture.service.getExpensesByCategory(
				authUser,
				{},
			);

			assert.strictEqual(result.currency, 'EUR');
			assert.strictEqual(result.totalExpenses, 9.09);
			assert.strictEqual(result.breakdown[0]?.amount, 9.09);
			assert.strictEqual(result.breakdown[0]?.percentage, 100);
			assert.strictEqual(result.breakdown[0]?.category, 'Streaming');

		});

		it('agrega gastos por categoría con múltiples suscripciones', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					categoryId: 1,
					cost: '10.00',
				}),
				makeSubscription({
					id: 'sub-2',
					categoryId: 1,
					cost: '5.00',
				}),
				makeSubscription({
					id: 'sub-3',
					categoryId: 2,
					cost: '20.00',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{},
			);

			assert.strictEqual(result.totalExpenses, 35);
			assert.strictEqual(result.breakdown.length, 2);

			const streaming = result.breakdown.find(
				(breakdown) => breakdown.category === 'Streaming',
			);
			const productivity = result.breakdown.find(
				(breakdown) => breakdown.category === 'Productivity',
			);

			assert.strictEqual(streaming?.amount, 15);
			assert.strictEqual(productivity?.amount, 20);
			assert.strictEqual(streaming?.percentage, 42.86);
			assert.strictEqual(productivity?.percentage, 57.14);
		});

		it('calcula porcentajes correctamente', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					categoryId: 1,
					cost: '75.00',
				}),
				makeSubscription({
					id: 'sub-2',
					categoryId: 2,
					cost: '25.00',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{},
			);

			const streaming = result.breakdown.find(
				(breakdown) => breakdown.category === 'Streaming',
			);
			const productivity = result.breakdown.find(
				(breakdown) => breakdown.category === 'Productivity',
			);

			assert.strictEqual(streaming?.percentage, 75);
			assert.strictEqual(productivity?.percentage, 25);
		});

		it('retorna breakdown vacío y totalExpenses 0 sin suscripciones', async () => {
			const fixture = createFixture([]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{},
			);

			assert.strictEqual(result.totalExpenses, 0);
			assert.deepStrictEqual(result.breakdown, []);
			assert.strictEqual(result.currency, 'USD');
		});

		it('filtra por billingUnit cuando se especifica en query', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					billingUnit: 'MONTHS',
					cost: '10.00',
				}),
				makeSubscription({
					id: 'sub-2',
					billingUnit: 'YEARS',
					cost: '120.00',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{ billingUnit: 'MONTHS' },
			);

			assert.strictEqual(result.totalExpenses, 10);
			assert.strictEqual(result.breakdown.length, 1);
		});

		it('filtra por status cuando se especifica en query', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					isActive: true,
					cost: '10.00',
				}),
				makeSubscription({
					id: 'sub-2',
					isActive: false,
					cost: '20.00',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{ status: false },
			);

			assert.strictEqual(result.totalExpenses, 20);
			assert.strictEqual(result.breakdown.length, 1);
			assert.strictEqual(result.breakdown[0]?.amount, 20);
			assert.strictEqual(result.breakdown[0]?.percentage, 100);
			assert.strictEqual(result.breakdown[0]?.category, 'Streaming');
		});

		it('normaliza multi-currency correctamente (EUR + ARS → USD)', async () => {
			// Sub1: 100 EUR → (100 * 1.10) / 1 = 110 USD
			// Sub2: 50000 ARS → (50000 * 0.001) / 1 = 50 USD
			// Total: 160 USD
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					categoryId: 1,
					currencyCode: 'EUR',
					cost: '100.00',
				}),
				makeSubscription({
					id: 'sub-2',
					categoryId: 2,
					currencyCode: 'ARS',
					cost: '50000.00',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(
				AUTH_USER,
				{},
			);

			assert.strictEqual(result.totalExpenses, 160);
			assert.strictEqual(result.currency, 'USD');

			const streaming = result.breakdown.find(
				(breakdown) => breakdown.category === 'Streaming',
			);
			const productivity = result.breakdown.find(
				(breakdown) => breakdown.category === 'Productivity',
			);

			assert.strictEqual(streaming?.amount, 110);
			assert.strictEqual(productivity?.amount, 50);
		});

		it('normaliza correctamente con primary currency EUR', async () => {
			const authUser: JWTPayload = {
				...AUTH_USER,
				primaryCurrencyCode: 'EUR',
			}
			const fixture = createFixture([
				makeSubscription({
					currencyCode: 'ARS',
					cost: '100000',
				}),
				makeSubscription({
					currencyCode: 'EUR',
					cost: '10',
				}),
			]);

			const result = await fixture.service.getExpensesByCategory(authUser, {});

		});

	});

	// ── Tests: getPaymentHistory ──

	describe('getPaymentHistory', () => {
		it('retorna historial de pagos en orden cronológico', async () => {
			const fixture = createFixture([
				makeSubscription({
					firstPaymentDate: new Date('2026-03-01T00:00:00Z'),
				}),
			]);

			const result = await fixture.service.getPaymentHistory(
				AUTH_USER,
				{},
			);

			assert.ok(result.length > 0, 'Debería retornar al menos un pago');

			// Verificar que están en orden cronológico
			for (let i = 1; i < result.length; i++) {
				const prev = new Date(result[i - 1]!.date).getTime();
				const curr = new Date(result[i]!.date).getTime();
				assert.ok(
					prev <= curr,
					`Pago ${i} debería ser >= pago ${i - 1} cronológicamente`,
				);
			}
		});

		it('incluye nombre de suscripción, categoría, monto y currency', async () => {
			const fixture = createFixture([
				makeSubscription({
					name: 'Netflix',
					categoryId: 1,
					cost: '15.99',
					currencyCode: 'EUR',
					firstPaymentDate: new Date('2026-06-01T00:00:00Z'),
				}),
			]);

			const result = await fixture.service.getPaymentHistory(
				AUTH_USER,
				{},
			);

			assert.ok(result.length > 0);
			const first = result[0];
			assert.strictEqual(first!.subscriptionName, 'Netflix');
			assert.strictEqual(first!.category, 'Streaming');
			assert.strictEqual(first!.amount, 15.99);
			assert.strictEqual(first!.currency, 'EUR');
		});

		it('intercala pagos de múltiples suscripciones cronológicamente', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					name: 'Spotify',
					categoryId: 1,
					firstPaymentDate: new Date('2026-06-01T00:00:00Z'),
				}),
				makeSubscription({
					id: 'sub-2',
					name: 'Notion',
					categoryId: 2,
					firstPaymentDate: new Date('2026-06-15T00:00:00Z'),
				}),
			]);

			const result = await fixture.service.getPaymentHistory(
				AUTH_USER,
				{},
			);

			assert.ok(result.length > 2, 'Debería tener pagos de ambas subs');

			// Verificar orden cronológico
			for (let i = 1; i < result.length; i++) {
				const prev = new Date(result[i - 1]!.date).getTime();
				const curr = new Date(result[i]!.date).getTime();
				assert.ok(prev <= curr);
			}

			// Verificar que ambas subs están presentes
			const names = new Set(result.map((r) => r.subscriptionName));
			assert.ok(names.has('Spotify'));
			assert.ok(names.has('Notion'));
		});

		it('retorna array vacío sin suscripciones activas', async () => {
			const fixture = createFixture([]);

			const result = await fixture.service.getPaymentHistory(
				AUTH_USER,
				{},
			);

			assert.deepStrictEqual(result, []);
		});

		it('filtra por billingUnit en payment history', async () => {
			const fixture = createFixture([
				makeSubscription({
					id: 'sub-1',
					name: 'Monthly Sub',
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date('2026-06-01T00:00:00Z'),
				}),
				makeSubscription({
					id: 'sub-2',
					name: 'Yearly Sub',
					billingUnit: 'YEARS',
					firstPaymentDate: new Date('2026-06-01T00:00:00Z'),
				}),
			]);

			const result = await fixture.service.getPaymentHistory(AUTH_USER, {
				billingUnit: 'YEARS',
			});

			const names = new Set(result.map((r) => r.subscriptionName));
			assert.ok(names.has('Yearly Sub'));
			assert.ok(
				!names.has('Monthly Sub'),
				'No debería incluir subs mensuales',
			);
		});

		it('cada entrada del historial tiene date como ISO string válido', async () => {
			const fixture = createFixture([
				makeSubscription({
					firstPaymentDate: new Date('2026-06-01T00:00:00Z'),
				}),
			]);

			const result = await fixture.service.getPaymentHistory(
				AUTH_USER,
				{},
			);

			for (const entry of result) {
				const parsed = new Date(entry.date);
				assert.ok(
					!isNaN(parsed.getTime()),
					`"${entry.date}" debería ser un ISO string válido`,
				);
			}
		});
	});
});
