import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Dashboard — Upcoming Renewals & Alerts', () => {
	const env = setupIntegrationEnvironment();
	const mockUser = {
		email: 'dashboard-test@example.com',
		password: 'password123',
		name: 'Dashboard Test User',
		primaryCurrencyCode: 'USD',
	};
	let cookie: string;
	let user: SafeUserAuthDto;
	let categoryId: number;

	before(async () => {
		const data = await loginAsUser(env.getApp(), mockUser);
		cookie = data.cookie;
		user = data.user;

		// Create a category for test subscriptions
		const catRes = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({ name: 'Dashboard Testing' });
		categoryId = catRes.body.data.id;

		// Create subscriptions with known billing dates for predictable results
		// Sub 1: Monthly, active, payment date in the past (will have future renewal)
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId,
				currencyCode: 'USD',
				name: 'Netflix',
				cost: 15.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date('2024-01-15').toISOString(),
			})
			.expect(201);

		// Sub 2: Monthly, active
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId,
				currencyCode: 'USD',
				name: 'Spotify',
				cost: 9.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date('2024-02-01').toISOString(),
			})
			.expect(201);

		// Sub 3: With active trial ending soon (should be prioritized in upcoming renewals)
		const trialEnd = new Date();
		trialEnd.setDate(trialEnd.getDate() + 3); // Trial ends in 3 days
		await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId,
				currencyCode: 'USD',
				name: 'Trial Service',
				cost: 29.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: trialEnd.toISOString(),
				trialEndsOn: trialEnd.toISOString(),
			})
			.expect(201);
	});

	describe('GET /api/v1/dashboard/upcoming-renewals', () => {
		it(
			'should return upcoming renewals with correct shape',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/dashboard/upcoming-renewals')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200)
					.expect('Content-Type', /json/);

				assert(Array.isArray(res.body.data));
				assert(res.body.data.length > 0);
				assert(res.body.data.length <= 5, 'Should return at most 5 renewals');

				// Verify shape of each renewal
				for (const renewal of res.body.data) {
					assert(typeof renewal.subscriptionName === 'string');
					assert(typeof renewal.category === 'string');
					assert(typeof renewal.renewalDate === 'string');
					assert(typeof renewal.amount === 'number');
					assert(renewal.amount >= 0, 'Amount must be non-negative');
				}
			},
		);

		it(
			'should not expose internal fields like isTrialEnding or sortDate',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/dashboard/upcoming-renewals')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				for (const renewal of res.body.data) {
					assert.strictEqual(
						renewal.isTrialEnding,
						undefined,
						'isTrialEnding should not be exposed',
					);
					assert.strictEqual(
						renewal.sortDate,
						undefined,
						'sortDate should not be exposed',
					);
				}
			},
		);

		it(
			'should reject unauthenticated requests',
			{ timeout: 10000 },
			async () => {
				await request(env.getApp())
					.get('/api/v1/dashboard/upcoming-renewals')
					.set('Origin', 'http://localhost:3000')
					.expect(401);
			},
		);
	});

	describe('GET /api/v1/dashboard/alerts', () => {
		it(
			'should return payment alerts with correct shape',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/dashboard/alerts')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200)
					.expect('Content-Type', /json/);

				assert(Array.isArray(res.body.data));

				// Verify shape of each alert
				for (const alert of res.body.data) {
					assert(typeof alert.subscriptionName === 'string');
					assert(typeof alert.category === 'string');
					assert(typeof alert.dueDate === 'string');
					assert(typeof alert.amount === 'number');
					assert(alert.amount >= 0, 'Amount must be non-negative');
				}
			},
		);

		it(
			'should return alerts sorted by closest due date',
			{ timeout: 10000 },
			async () => {
				const res = await request(env.getApp())
					.get('/api/v1/dashboard/alerts')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.expect(200);

				const alerts = res.body.data;
				for (let i = 1; i < alerts.length; i++) {
					const prevDate = new Date(alerts[i - 1].dueDate).getTime();
					const currDate = new Date(alerts[i].dueDate).getTime();
					assert(
						prevDate <= currDate,
						'Alerts should be sorted by due date ascending',
					);
				}
			},
		);

		it(
			'should reject unauthenticated requests',
			{ timeout: 10000 },
			async () => {
				await request(env.getApp())
					.get('/api/v1/dashboard/alerts')
					.set('Origin', 'http://localhost:3000')
					.expect(401);
			},
		);
	});
});
