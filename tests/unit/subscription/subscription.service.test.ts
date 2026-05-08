import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryService from '@/modules/category/category.service.js';
import type CurrencyService from '@/modules/currency/currency.service.js';
import type SubscriptionRepository from '@/modules/subscription/subscription.repository.js';
import SubscriptionService from '@/modules/subscription/subscription.service.js';
import type {
	CreateSubscriptionInput,
	SubscriptionDomain,
	UpdateSubscriptionData,
} from '@/modules/subscription/subscription.type.js';

const AUTH_USER: JWTPayload = {
	sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
	email: 'user@example.com',
	name: 'Unit User',
	role: 'USER',
	primaryCurrencyCode: 'USD',
};

const BASE_SUBSCRIPTION: SubscriptionDomain = {
	id: '0197f644-3f67-7f07-9537-6cc9db95f111',
	userId: AUTH_USER.sub,
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Spotify',
	cost: '10.00',
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	isActive: true,
	firstPaymentDate: new Date('2026-01-01T00:00:00.000Z'),
	trialEndsOn: null,
};

const CREATE_INPUT: CreateSubscriptionInput = {
	categoryId: 1,
	currencyCode: 'USD',
	name: 'Spotify',
	cost: 10,
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	firstPaymentDate: new Date('2026-01-01T00:00:00.000Z'),
};

const createServiceFixture = () => {
	const repositoryCalls: {
		createData?: unknown;
		getTotalMonthlySubscriptionsUserIds: string[];
		getTotalAnnualSubscriptionsUserIds: string[];
		getTotalDailySubscriptionsUserIds: string[];
		getTotalWeekSubscriptionsUserIds: string[];
		findByIdIds: string[];
		updateData?: { id: string; data: Partial<UpdateSubscriptionData> };
	} = {
		getTotalMonthlySubscriptionsUserIds: [],
		getTotalAnnualSubscriptionsUserIds: [],
		getTotalDailySubscriptionsUserIds: [],
		getTotalWeekSubscriptionsUserIds: [],
		findByIdIds: [],
	};

	const categoryCalls: number[] = [];
	const currencyCalls: string[] = [];

	const subscriptionRepository = {
		create: async (data: unknown) => {
			repositoryCalls.createData = data;
			return BASE_SUBSCRIPTION;
		},
		findById: async (id: string) => {
			repositoryCalls.findByIdIds.push(id);
			return BASE_SUBSCRIPTION;
		},
		getTotalMonthlySubscriptions: async (userId: string) => {
			repositoryCalls.getTotalMonthlySubscriptionsUserIds.push(userId);
			return [
				{
					cost: '10.00',
					billingFrequency: 2,
					billingUnit: 'MONTHS' as const,
				},
				{
					cost: '4.50',
					billingFrequency: 3,
					billingUnit: 'MONTHS' as const,
				},
			];
		},
		getTotalAnnualSubscriptions: async (userId: string) => {
			repositoryCalls.getTotalAnnualSubscriptionsUserIds.push(userId);
			return [
				{
					cost: '7.25',
					billingFrequency: 4,
					billingUnit: 'YEARS' as const,
				},
			];
		},
		getTotalDailySubscriptions: async (userId: string) => {
			repositoryCalls.getTotalDailySubscriptionsUserIds.push(userId);
			return [
				{
					cost: '1.50',
					billingFrequency: 2,
					billingUnit: 'DAYS' as const,
				},
				{
					cost: '0.75',
					billingFrequency: 4,
					billingUnit: 'DAYS' as const,
				},
			];
		},
		getTotalWeeklySubscriptions: async (userId: string) => {
			repositoryCalls.getTotalWeekSubscriptionsUserIds.push(userId);
			return [
				{
					cost: '3.25',
					billingFrequency: 2,
					billingUnit: 'WEEKS' as const,
				},
			];
		},
		update: async (id: string, data: Partial<UpdateSubscriptionData>) => {
			repositoryCalls.updateData = { id, data };
			return {
				...BASE_SUBSCRIPTION,
				...data,
			};
		},
	} as unknown as SubscriptionRepository;

	const categoryService = {
		getCategoryById: async (id: number) => {
			categoryCalls.push(id);
			return {
				id,
				name: 'Streaming',
				userId: AUTH_USER.sub,
			};
		},
	} as unknown as CategoryService;

	const currencyService = {
		getCurrencyByCode: async (code: string) => {
			currencyCalls.push(code);
			return { code, name: 'US Dollar', symbol: '$' };
		},
	} as unknown as CurrencyService;

	const service = new SubscriptionService(
		subscriptionRepository,
		categoryService,
		currencyService,
	);

	return {
		service,
		subscriptionRepository,
		categoryService,
		currencyService,
		repositoryCalls,
		categoryCalls,
		currencyCalls,
	};
};

describe('Subscription Service', () => {
	it('createSubscription valida currency primero y luego category ownership', async () => {
		const fixture = createServiceFixture();

		fixture.currencyService.getCurrencyByCode = async (code: string) => {
			fixture.currencyCalls.push(code);
			throw new Error('currency-not-found');
		};

		await assert.rejects(() =>
			fixture.service.createSubscription(CREATE_INPUT, AUTH_USER),
		);

		assert.deepStrictEqual(fixture.currencyCalls, ['USD']);
		assert.deepStrictEqual(
			fixture.categoryCalls,
			[],
			'Category validation should not run when currency validation fails first',
		);

		fixture.currencyService.getCurrencyByCode = async (code: string) => {
			fixture.currencyCalls.push(code);
			return { code, name: 'US Dollar', symbol: '$' };
		};
		fixture.categoryService.getCategoryById = async (id: number) => {
			fixture.categoryCalls.push(id);
			return {
				id,
				name: 'Foreign Category',
				userId: '0197f644-3f67-7f07-9537-6cc9db95faaa',
			};
		};

		await assert.rejects(
			() => fixture.service.createSubscription(CREATE_INPUT, AUTH_USER),
			(error: unknown) => {
				assert.equal((error as { status?: number }).status, 403);
				return true;
			},
		);
	});

	it('getSubscriptionById valida notFound y ownership', async () => {
		const fixture = createServiceFixture();

		fixture.subscriptionRepository.findById = async () => null;

		await assert.rejects(
			() =>
				fixture.service.getSubscriptionById(
					'0197f644-3f67-7f07-9537-6cc9db95f999',
					AUTH_USER.sub,
				),
			(error: unknown) => {
				assert.equal((error as { status?: number }).status, 404);
				return true;
			},
		);

		fixture.subscriptionRepository.findById = async () => ({
			...BASE_SUBSCRIPTION,
			userId: '0197f644-3f67-7f07-9537-6cc9db95faaa',
		});

		await assert.rejects(
			() =>
				fixture.service.getSubscriptionById(
					BASE_SUBSCRIPTION.id,
					AUTH_USER.sub,
				),
			(error: unknown) => {
				assert.equal((error as { status?: number }).status, 403);
				return true;
			},
		);
	});

	it('updateSubscription ajusta firstPaymentDate cuando trialEndsOn existe', async () => {
		const fixture = createServiceFixture();
		const trialEndsOn = new Date('2026-02-01T00:00:00.000Z');
		const differentFirstPaymentDate = new Date('2026-03-01T00:00:00.000Z');

		await fixture.service.updateSubscription(
			BASE_SUBSCRIPTION.id,
			{
				trialEndsOn,
				firstPaymentDate: differentFirstPaymentDate,
			},
			AUTH_USER.sub,
		);

		assert.ok(fixture.repositoryCalls.updateData);
		assert.strictEqual(
			fixture.repositoryCalls.updateData?.data.firstPaymentDate,
			trialEndsOn,
		);
		assert.strictEqual(
			fixture.repositoryCalls.updateData?.data.trialEndsOn,
			trialEndsOn,
		);
	});

	it('getTotalMonthlySubscriptions suma los totales activos por billingUnit', async () => {
		const fixture = createServiceFixture();

		const total = await fixture.service.getTotalMonthlySubscriptions(
			AUTH_USER.sub,
		);

		assert.strictEqual(total, '33.50');
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalMonthlySubscriptionsUserIds,
			[AUTH_USER.sub],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalAnnualSubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalDailySubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalWeekSubscriptionsUserIds,
			[],
		);
	});

	it('getTotalAnnualSubscriptions suma los totales activos por billingUnit', async () => {
		const fixture = createServiceFixture();

		const total = await fixture.service.getTotalAnnualSubscriptions(
			AUTH_USER.sub,
		);

		assert.strictEqual(total, '29.00');
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalAnnualSubscriptionsUserIds,
			[AUTH_USER.sub],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalMonthlySubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalDailySubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalWeekSubscriptionsUserIds,
			[],
		);
	});

	it('getTotalDailySubscriptions suma los totales activos por billingUnit', async () => {
		const fixture = createServiceFixture();

		const total = await fixture.service.getTotalDailySubscriptions(
			AUTH_USER.sub,
		);

		assert.strictEqual(total, '6.00');
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalDailySubscriptionsUserIds,
			[AUTH_USER.sub],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalMonthlySubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalAnnualSubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalWeekSubscriptionsUserIds,
			[],
		);
	});

	it('getTotalWeekSubscriptions suma los totales activos por billingUnit', async () => {
		const fixture = createServiceFixture();

		const total = await fixture.service.getTotalWeeklySubscriptions(
			AUTH_USER.sub,
		);

		assert.strictEqual(total, '6.50');
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalWeekSubscriptionsUserIds,
			[AUTH_USER.sub],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalMonthlySubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalAnnualSubscriptionsUserIds,
			[],
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.getTotalDailySubscriptionsUserIds,
			[],
		);
	});
});
