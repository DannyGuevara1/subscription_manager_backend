import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { Temporal } from 'temporal-polyfill';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';
import {
	financialPortfolio,
	PORTFOLIO_ORACLE,
	REFERENCE_DATE,
} from '../../fixtures/financial.js';

describe('Personal finance journey', () => {
	const env = setupIntegrationEnvironment();
	it('reconciles the shared portfolio through pause, resume and terminal cancellation', async (t) => {
		t.mock.timers.enable({ apis: ['Date'], now: REFERENCE_DATE });
		t.mock.method(Temporal.Now, 'zonedDateTimeISO', () =>
			Temporal.Instant.fromEpochMilliseconds(
				REFERENCE_DATE.getTime(),
			).toZonedDateTimeISO('UTC'),
		);
		const app = env.getApp();
		const agent = request.agent(app);
		await agent
			.post('/api/v1/auth/register')
			.send({
				name: 'Financial Journey',
				email: 'journey@example.test',
				password: 'journey-password',
				primaryCurrencyCode: 'USD',
			})
			.expect(201);
		await agent
			.post('/api/v1/auth/login')
			.send({ email: 'journey@example.test', password: 'journey-password' })
			.expect(200);
		await env
			.getPrismaClient()
			.currency.update({
				where: { code: 'EUR' },
				data: { exchangeRateToUSD: 1.08, rateUpdatedAt: REFERENCE_DATE },
			});
		const category = await agent
			.post('/api/v1/categories')
			.send({ name: 'Personal' })
			.expect(201);
		const ids = new Map<string, string>();
		for (const sub of financialPortfolio()) {
			const response = await agent
				.post('/api/v1/subscriptions')
				.send({
					categoryId: category.body.data.id,
					currencyCode: sub.currencyCode,
					name: sub.name,
					cost: sub.cost,
					costType: sub.costType,
					billingFrequency: sub.billingFrequency,
					billingUnit: sub.billingUnit,
					firstPaymentDate: sub.firstPaymentDate.toISOString(),
					...(sub.trialEndsOn
						? { trialEndsOn: sub.trialEndsOn.toISOString() }
						: {}),
				})
				.expect(201);
			ids.set(sub.name, response.body.data.id);
			if (sub.status !== 'ACTIVE')
				await agent
					.patch(`/api/v1/subscriptions/${response.body.data.id}/status`)
					.send({ status: sub.status })
					.expect(200);
		}
		const summary = async () =>
			(await agent.get('/api/v1/dashboard/summary').expect(200)).body.data;
		const expenses = async () =>
			(await agent.get('/api/v1/analytics/expenses-by-category').expect(200))
				.body.data;
		const timeline = async (): Promise<
			{ subscriptionName: string; date: string }[]
		> =>
			(await agent.get('/api/v1/analytics/payment-timeline').expect(200)).body
				.data;
		let result = await summary();
		for (const key of [
			'projectedMonthly',
			'currentMonthly',
			'projectedAnnual',
			'currentAnnual',
		] as const)
			assert.equal(result[key], PORTFOLIO_ORACLE[key]);
		assert.equal((await expenses()).totalExpenses, 309.25);
		let entries = await timeline();
		assert.ok(
			!entries.some((e) =>
				['Resumable', 'Cancelled'].includes(e.subscriptionName),
			),
		);
		assert.ok(
			entries
				.filter((e) => e.subscriptionName === 'Trial')
				.every((e) => e.date >= '2026-10-03T12:00:00.000Z'),
		);
		assert.deepEqual(
			entries.map((e) => e.date),
			entries.map((e) => e.date).sort(),
		);
		// Pause streaming: remove $15.99/month and all contractual timeline entries.
		await agent
			.patch(`/api/v1/subscriptions/${ids.get('Streaming')}/status`)
			.send({ status: 'PAUSED' })
			.expect(200);
		assert.equal((await summary()).projectedMonthly, '126.94');
		assert.equal((await expenses()).totalExpenses, 293.26);
		assert.ok(
			!(await timeline()).some((e) => e.subscriptionName === 'Streaming'),
		);
		const resumed = await agent
			.patch(`/api/v1/subscriptions/${ids.get('Streaming')}/status`)
			.send({ status: 'ACTIVE' })
			.expect(200);
		assert.equal(resumed.body.data.resumedAt, REFERENCE_DATE.toISOString());
		assert.equal((await summary()).projectedMonthly, '142.93');
		const renewals = await agent
			.get('/api/v1/dashboard/upcoming-renewals')
			.expect(200);
		assert.equal(
			renewals.body.data.find(
				(e: { subscriptionName: string }) => e.subscriptionName === 'Streaming',
			)?.renewalDate,
			REFERENCE_DATE.toISOString(),
		);
		await agent
			.patch(`/api/v1/subscriptions/${ids.get('Streaming')}/status`)
			.send({ status: 'CANCELLED' })
			.expect(200);
		assert.equal((await summary()).projectedMonthly, '126.94');
		assert.ok(
			!(await timeline()).some((e) => e.subscriptionName === 'Streaming'),
		);
		await agent
			.patch(`/api/v1/subscriptions/${ids.get('Streaming')}/status`)
			.send({ status: 'ACTIVE' })
			.expect(409);
		// Another user sees no amounts or timeline entries from this portfolio.
		const other = request.agent(app);
		await other
			.post('/api/v1/auth/register')
			.send({
				name: 'Isolated User',
				email: 'isolated@example.test',
				password: 'journey-password',
				primaryCurrencyCode: 'USD',
			})
			.expect(201);
		await other
			.post('/api/v1/auth/login')
			.send({
				name: 'Isolated User',
				email: 'isolated@example.test',
				password: 'journey-password',
			})
			.expect(200);
		assert.equal(
			(await other.get('/api/v1/dashboard/summary').expect(200)).body.data
				.totalMonthly,
			'0.00',
		);
		assert.deepEqual(
			(await other.get('/api/v1/analytics/payment-timeline').expect(200)).body
				.data,
			[],
		);
		// Direct reconciliation is valid for monthly frequency-one subscriptions without trial.
		const monthlyCategory = await other
			.post('/api/v1/categories')
			.send({ name: 'Monthly only' })
			.expect(201);
		for (const [currencyCode, cost] of [
			['USD', 10],
			['EUR', 20],
		] as const) {
			await other
				.post('/api/v1/subscriptions')
				.send({
					categoryId: monthlyCategory.body.data.id,
					name: `Monthly ${currencyCode}`,
					currencyCode,
					cost,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: REFERENCE_DATE.toISOString(),
				})
				.expect(201);
		}
		const monthlySummary = (
			await other.get('/api/v1/dashboard/summary').expect(200)
		).body.data;
		const monthlyAnalytics = (
			await other.get('/api/v1/analytics/expenses-by-category').expect(200)
		).body.data;
		assert.equal(monthlySummary.totalMonthly, '31.60'); // USD 10 + EUR 20 *1.08.
		assert.equal(monthlyAnalytics.totalExpenses, 31.6);
		assert.equal(
			Number(monthlySummary.totalMonthly),
			monthlyAnalytics.totalExpenses,
		);
		assert.equal(
			(
				await other
					.get('/api/v1/analytics/expenses-by-category?status=true')
					.expect(200)
			).body.data.totalExpenses,
			31.6,
		);
		assert.equal(
			(
				await other
					.get('/api/v1/analytics/expenses-by-category?status=false')
					.expect(200)
			).body.data.totalExpenses,
			0,
		);
	});
});
