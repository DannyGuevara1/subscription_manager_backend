import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import DashboardService from '@/modules/dashboard/dashboard.service.js';
import type SubscriptionCostNormalizerService from '@/modules/dashboard/subscription-cost-normalizer.service.js';
import type SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type { SubscriptionService } from '@/modules/subscription/index.js';
import type { SubscriptionDomain } from '@/modules/subscription/subscription.type.js';

const AUTH_USER: JWTPayload = {
	sub: 'user-1',
	email: 'user@test.com',
	name: 'Test User',
	role: 'USER',
	primaryCurrencyCode: 'USD',
};

// Suscripción "reanudada": empezó en enero, se reanudó el 7 de agosto.
const RESUMED_SUBSCRIPTION: SubscriptionDomain = {
	id: 'sub-1',
	userId: AUTH_USER.sub,
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Gym',
	cost: 30,
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	firstPaymentDate: new Date('2026-01-01T00:00:00Z'),
	resumedAt: new Date('2026-08-07T00:00:00Z'),
	trialEndsOn: null,
	status: 'ACTIVE',
};

/**
 * Fixture: crea el DashboardService con todos sus colaboradores falseados.
 * - Stubs: devuelven respuestas prefijadas (subscriptionService, categoryService).
 * - Spy: calculatorCalls anota QUÉ le pasaron al calculador, para verificarlo.
 */
const createDashboardFixture = (subscriptions: SubscriptionDomain[]) => {
	// 1. El "cuaderno de notas" del espía: aquí se registran las llamadas
	const calculatorCalls: { firstPaymentDate: Date }[] = [];

	// 2. Stub del servicio de suscripciones: devuelve la lista que tú decidas
	const subscriptionService = {
		getActiveSubscriptions: async (_userId: string) => subscriptions,
	} as unknown as SubscriptionService;

	// 3. Spy del calculador: ANOTA lo que recibe y devuelve una fecha fija.
	//    No calculamos de verdad — solo queremos saber qué ancla le pasaron.
	const subscriptionCalculatorService = {
		nextPaymentDate: (config: { firstPaymentDate: Date }) => {
			calculatorCalls.push({ firstPaymentDate: config.firstPaymentDate });
			return new Date('2026-09-07T00:00:00Z'); // respuesta fija, da igual cuál
		},
	} as unknown as SubscriptionCalculatorService;

	// 4. Stub del normalizador: getUpcomingRenewals no lo usa, pero el
	//    constructor lo exige. Un objeto vacío con cast basta.
	const subscriptionCostNormalizerService =
		{} as unknown as SubscriptionCostNormalizerService;

	// 5. Stub de categorías: devuelve un Map con el nombre que esperamos
	const categoryService = {
		getCategoriesByIds: async (_ids: number[], _userId: string) =>
			new Map([[1, 'Fitness']]),
	} as unknown as CategoryService;

	const service = new DashboardService(
		subscriptionService,
		subscriptionCostNormalizerService,
		subscriptionCalculatorService,
		categoryService,
	);

	return { service, calculatorCalls };
};

describe('DashboardService - ancla de facturación', () => {
	it('usa resumedAt como ancla para una suscripción reanudada', async () => {
		// Arrange
		const fixture = createDashboardFixture([RESUMED_SUBSCRIPTION]);

		// Act
		await fixture.service.getUpcomingRenewals(AUTH_USER);

		// Assert: el calculador recibió resumedAt, NO firstPaymentDate
		assert.strictEqual(fixture.calculatorCalls.length, 1);
		assert.deepStrictEqual(
			fixture.calculatorCalls[0]?.firstPaymentDate,
			RESUMED_SUBSCRIPTION.resumedAt,
			'El dashboard debe anclar la proyección a resumedAt tras una reanudación',
		);
	});

	it('usa firstPaymentDate como ancla para una suscripción nunca pausada', async () => {
		// TODO: Tu turno. Crea una variante de RESUMED_SUBSCRIPTION con
		// resumedAt: null, pásala al fixture, llama a getUpcomingRenewals y
		// verifica que calculatorCalls recibió firstPaymentDate.
	});
});
