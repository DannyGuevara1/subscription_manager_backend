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
	cost: 10,
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	status: 'ACTIVE',
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
		findByIdIds: string[];
		updateData?: { id: string; data: Partial<UpdateSubscriptionData> };
	} = {
		findByIdIds: [],
	};

	const categoryCalls: number[] = [];
	const currencyCalls: string[] = [];

	const subscriptionRepository = {
		create: async (data: any) => {
			repositoryCalls.createData = data;
			return {
				...BASE_SUBSCRIPTION,
				...data,
			};
		},
		findById: async (id: string) => {
			repositoryCalls.findByIdIds.push(id);
			return BASE_SUBSCRIPTION;
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
			return { 
				code, 
				name: 'US Dollar', 
				symbol: '$',
				exchangeRateToUSD: 1,
				rateUpdatedAt: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			};
		};
		fixture.categoryService.getCategoryById = async (id: number) => {
			fixture.categoryCalls.push(id);
			return {
				id,
				name: 'Foreign Category',
				userId: '0197f644-3f67-7f07-9537-6cc9db95faaa',
				createdAt: new Date(),
				updatedAt: new Date()
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

	it('createSubscription auto-asigna firstPaymentDate si trialEndsOn esta presente', async () => {
		const fixture = createServiceFixture();
		const trialEndsOn = new Date('2026-02-01T00:00:00.000Z');
		const input: CreateSubscriptionInput = {
			...CREATE_INPUT,
			trialEndsOn,
		};

		const created = await fixture.service.createSubscription(
			input,
			AUTH_USER,
		);

		const { id, ...createDataWithoutId } = fixture.repositoryCalls.createData as any;
		assert.strictEqual(typeof id, 'string');
		assert.deepStrictEqual(createDataWithoutId, {
			...input,
			userId: AUTH_USER.sub,
			firstPaymentDate: trialEndsOn,
		});
	});

	it('createSubscription mantiene firstPaymentDate si trialEndsOn esta ausente', async () => {
		const fixture = createServiceFixture();
		const created = await fixture.service.createSubscription(
			CREATE_INPUT,
			AUTH_USER,
		);

		assert.deepStrictEqual(
			created.firstPaymentDate,
			CREATE_INPUT.firstPaymentDate,
		);
	});

	it('updateSubscription NO toca firstPaymentDate al actualizar trialEndsOn (campo inmutable)', async () => {
		const fixture = createServiceFixture();
		const trialEndsOn = new Date('2026-03-01T00:00:00.000Z');
		const id = '0197f644-3f67-7f07-9537-6cc9db95f111';

		await fixture.service.updateSubscription(
			id,
			{ trialEndsOn },
			AUTH_USER.sub,
		);

		assert.deepStrictEqual(fixture.repositoryCalls.updateData?.id, id);
		assert.ok(
			!('firstPaymentDate' in (fixture.repositoryCalls.updateData?.data ?? {})),
			'firstPaymentDate es inmutable tras la creación',
		);
		assert.deepStrictEqual(
			fixture.repositoryCalls.updateData?.data.trialEndsOn,
			trialEndsOn,
		);
	});
});
