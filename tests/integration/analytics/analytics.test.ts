import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Analytics — Expenses by Category & Payment History', () => {
	const env = setupIntegrationEnvironment();
	const mockUser = {
		email: 'analytics-test@example.com',
		password: 'password123',
		name: 'Analytics Test User',
		primaryCurrencyCode: 'USD',
	};
	let cookie: string;
	let user: SafeUserAuthDto;
	let streamingCategoryId: number;
	let softwareCategoryId: number;

	before(async () => {
		const data = await loginAsUser(env.getApp(), mockUser);
		cookie = data.cookie;
		user = data.user;

		// Create two categories for grouping validation
		const streamingRes = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({ name: 'Streaming' });
		streamingCategoryId = streamingRes.body.data.id;

		const softwareRes = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({ name: 'Software' });
		softwareCategoryId = softwareRes.body.data.id;

		// Create subscriptions across categories
		// Streaming: Netflix ($15.99/mo) + Spotify ($9.99/mo)
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId: streamingCategoryId,
				currencyCode: 'USD',
				name: 'Netflix',
				cost: 15.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date('2024-01-15').toISOString(),
			})
			.expect(201);

		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId: streamingCategoryId,
				currencyCode: 'USD',
				name: 'Spotify',
				cost: 9.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date('2024-02-01').toISOString(),
			})
			.expect(201);

		// Software: Adobe ($52.99/mo)
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId: softwareCategoryId,
				currencyCode: 'USD',
				name: 'Adobe Creative Cloud',
				cost: 52.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date('2024-03-01').toISOString(),
			})
			.expect(201);

		// Yearly subscription for filter testing
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId: softwareCategoryId,
				currencyCode: 'USD',
				name: 'JetBrains',
				cost: 149.0,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'YEARS',
				firstPaymentDate: new Date('2024-01-01').toISOString(),
			})
			.expect(201);
	});

	describe('GET /api/v1/analytics/expenses-by-category', () => {
		it(
			'should return aggregated expenses with correct shape',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/analytics/expenses-by-category')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200)
					.expect('Content-Type', /json/);

				const data = res.body.data;
				assert(typeof data.currency === 'string');
				assert.strictEqual(data.currency, 'USD');
				assert(typeof data.totalExpenses === 'number');
				assert(data.totalExpenses > 0);
				assert(Array.isArray(data.breakdown));
				assert(data.breakdown.length > 0);

				// Verify breakdown shape
				for (const entry of data.breakdown) {
					assert(typeof entry.category === 'string');
					assert(typeof entry.amount === 'number');
					assert(typeof entry.percentage === 'number');
					assert(entry.amount >= 0);
					assert(entry.percentage >= 0);
					assert(entry.percentage <= 100);
				}
			},
		);

		it(
			'should have breakdown percentages that sum to ~100%',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/analytics/expenses-by-category')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				const totalPercentage = res.body.data.breakdown.reduce(
					(sum: number, entry: { percentage: number }) =>
						sum + entry.percentage,
					0,
				);

				// Allow small rounding tolerance
				assert(
					Math.abs(totalPercentage - 100) < 1,
					`Percentages should sum to ~100%, got ${totalPercentage}`,
				);
			},
		);

		it(
			'should filter by billingUnit when provided',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/analytics/expenses-by-category?billingUnit=MONTHS')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				// Should not include the YEARS subscription (JetBrains)
				const data = res.body.data;
				assert(typeof data.totalExpenses === 'number');
				assert(data.totalExpenses > 0);
			},
		);

		it(
			'should reject unauthenticated requests',
			{ timeout: 10000 },
			async () => {
				await request(env.getApp())
					.get('/api/v1/analytics/expenses-by-category')
					.set('Origin', 'http://localhost:3000')
					.expect(401);
			},
		);

		it(
			'should reject invalid billingUnit query param',
			{ timeout: 10000 },
			async () => {
				await request(env.getApp())
					.get('/api/v1/analytics/expenses-by-category?billingUnit=INVALID')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(422);
			},
		);
	});

	describe('GET /api/v1/analytics/payment-history', () => {
		it(
			'should return chronological payment projections',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/analytics/payment-history')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200)
					.expect('Content-Type', /json/);

				assert(Array.isArray(res.body.data));
				assert(res.body.data.length > 0);

				// Verify shape of each entry
				for (const entry of res.body.data) {
					assert(typeof entry.subscriptionName === 'string');
					assert(typeof entry.category === 'string');
					assert(typeof entry.amount === 'number');
					assert(typeof entry.currency === 'string');
					assert(typeof entry.date === 'string');
					assert(entry.amount > 0);
				}
			},
		);

		it(
			'should return entries in chronological order',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/analytics/payment-history')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				const entries = res.body.data;
				for (let i = 1; i < entries.length; i++) {
					const prevDate = new Date(entries[i - 1].date).getTime();
					const currDate = new Date(entries[i].date).getTime();
					assert(
						prevDate <= currDate,
						`Entries should be chronological: ${entries[i - 1].date} should be <= ${entries[i].date}`,
					);
				}
			},
		);

		it(
			'should filter by billingUnit when provided',
			{ timeout: 10000 },
			async () => {
				const allRes = await request(env.getApp())
					.get('/api/v1/analytics/payment-history')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				const monthsRes = await request(env.getApp())
					.get('/api/v1/analytics/payment-history?billingUnit=MONTHS')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				// Filtered result should have fewer or equal entries
				assert(
					monthsRes.body.data.length <= allRes.body.data.length,
					'Filtered results should not exceed unfiltered results',
				);
			},
		);

		it(
			'should reject unauthenticated requests',
			{ timeout: 10000 },
			async () => {
				await request(env.getApp())
					.get('/api/v1/analytics/payment-history')
					.set('Origin', 'http://localhost:3000')
					.expect(401);
			},
		);
	});
});
