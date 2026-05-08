import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import SubscriptionRepository from '@/modules/subscription/subscription.repository.js';

type DecimalLike = {
	toFixed: (digits: number) => string;
};

const createDecimalLike = (value: string): DecimalLike => ({
	toFixed: (digits: number) => {
		assert.strictEqual(digits, 2);
		return Number(value).toFixed(2);
	},
});

const createPrismaSubscriptionRecord = (cost: DecimalLike) => ({
	id: '0197f644-3f67-7f07-9537-6cc9db95f111',
	userId: '0197f644-3f67-7f07-9537-6cc9db95fddd',
	categoryId: 7,
	currencyCode: 'USD',
	name: 'Spotify',
	cost,
	costType: 'FIXED',
	billingFrequency: 1,
	billingUnit: 'MONTHS',
	firstPaymentDate: new Date('2026-01-01T00:00:00.000Z'),
	trialEndsOn: null,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('Subscription Repository', () => {
	it('serializa cost como string exacto con dos decimales', async () => {
		const prismaMock = {
			subscription: {
				create: async () =>
					createPrismaSubscriptionRecord(createDecimalLike('15')),
			},
		} as unknown as PrismaClient;

		const repository = new SubscriptionRepository(prismaMock);
		const created = await repository.create({
			id: '0197f644-3f67-7f07-9537-6cc9db95f111',
			userId: '0197f644-3f67-7f07-9537-6cc9db95fddd',
			categoryId: 7,
			currencyCode: 'USD',
			name: 'Spotify',
			cost: 15,
			costType: 'FIXED',
			billingFrequency: 1,
			billingUnit: 'MONTHS',
			firstPaymentDate: new Date('2026-01-01T00:00:00.000Z'),
		});

		assert.strictEqual(created.cost, '15.00');
		assert.strictEqual(typeof created.cost, 'string');
	});

	it('no retorna number en cost (regresion de precision)', async () => {
		const prismaMock = {
			subscription: {
				findUnique: async () =>
					createPrismaSubscriptionRecord(createDecimalLike('15.9')),
			},
		} as unknown as PrismaClient;

		const repository = new SubscriptionRepository(prismaMock);
		const subscription = await repository.findById(
			'0197f644-3f67-7f07-9537-6cc9db95f111',
		);

		assert.ok(subscription);
		assert.strictEqual(subscription?.cost, '15.90');
		assert.notStrictEqual(typeof subscription?.cost, 'number');
	});

	it('reutiliza el mismo filtro para todos los billingUnit', async () => {
		const findManyCalls: Array<{ where: { billingUnit: string } }> = [];
		const prismaMock = {
			subscription: {
				findMany: async (args: { where: { billingUnit: string } }) => {
					findManyCalls.push(args);
					return [createPrismaSubscriptionRecord(createDecimalLike('12.5'))];
				},
			},
		} as unknown as PrismaClient;

		const repository = new SubscriptionRepository(prismaMock);

		const monthly = await repository.getTotalMonthlySubscriptions('user-1');
		const annual = await repository.getTotalAnnualSubscriptions('user-1');
		const daily = await repository.getTotalDailySubscriptions('user-1');
		const weekly = await repository.getTotalWeeklySubscriptions('user-1');

		assert.deepStrictEqual(
			findManyCalls.map((call) => call.where.billingUnit),
			['MONTHS', 'YEARS', 'DAYS', 'WEEKS'],
		);
		assert.deepStrictEqual(monthly[0], {
			cost: '12.50',
			billingFrequency: 1,
			billingUnit: 'MONTHS',
		});
		assert.deepStrictEqual(annual[0], {
			cost: '12.50',
			billingFrequency: 1,
			billingUnit: 'YEARS',
		});
		assert.deepStrictEqual(daily[0], {
			cost: '12.50',
			billingFrequency: 1,
			billingUnit: 'DAYS',
		});
		assert.deepStrictEqual(weekly[0], {
			cost: '12.50',
			billingFrequency: 1,
			billingUnit: 'WEEKS',
		});
	});
});
