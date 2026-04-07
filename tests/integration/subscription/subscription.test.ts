import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Modulo de Suscripciones', () => {
	const env = setupIntegrationEnvironment();
	const mockUser = {
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		primaryCurrencyCode: 'USD',
	};
	let cookie: string;
	let user: SafeUserAuthDto;
	let categoryId: number;

	// Second user for cross-user tests
	let otherUserCookie: string;
	let otherCategoryId: number;

	before(async () => {
		const data = await loginAsUser(env.getApp(), mockUser);

		cookie = data.cookie;
		user = data.user;
		// Create a category for the subscription tests
		const response = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				name: 'Billes',
			});
		categoryId = response.body.data.id;

		// Setup second user for cross-user tests
		const otherData = await loginAsUser(env.getApp(), {
			email: 'other@example.com',
			password: 'password123',
			name: 'Other User',
			primaryCurrencyCode: 'USD',
		});
		otherUserCookie = otherData.cookie;

		const otherCatResp = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.send({
				name: 'Entertainment',
			});
		otherCategoryId = otherCatResp.body.data.id;
	});

	it('Debería crear una nueva suscripción', { timeout: 10000 }, async () => {
		const res = await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				categoryId,
				currencyCode: 'USD',
				name: 'Spotify',
				cost: 15.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date().toISOString(),
			})
			.expect(201)
			.expect('Content-Type', /json/);

		const sub = res.body.data;
		assert(sub.id);
		assert.strictEqual(sub.userId, user.id);
		assert.strictEqual(sub.categoryId, categoryId);
		assert.strictEqual(sub.currencyCode, 'USD');
		assert.strictEqual(sub.name, 'Spotify');
		assert.strictEqual(sub.cost, '15.99');
		assert.strictEqual(sub.costType, 'FIXED');
		assert.strictEqual(sub.billingFrequency, 1);
		assert.strictEqual(sub.billingUnit, 'MONTHS');
		assert(sub.firstPaymentDate);
		assert.strictEqual(sub.trialEndsOn, null);
	});

	it(
		'firstPaymentDate debe ser autoestablecido si se proporciona trialEndsOn',
		{ timeout: 10000 },
		async () => {
			const trialEnd = new Date('2026-04-01T00:00:00.000Z');

			const res = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Trial Service',
					cost: 15.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(), // será sobreescrito
					trialEndsOn: trialEnd.toISOString(),
				})
				.expect(201)
				.expect('Content-Type', /json/);

			assert.strictEqual(
				res.body.data.firstPaymentDate,
				trialEnd.toISOString(),
				'firstPaymentDate debe coincidir con trialEndsOn',
			);
			assert.strictEqual(
				res.body.data.firstPaymentDate,
				res.body.data.trialEndsOn,
			);
		},
	);

	it(
		'Debería retornar error al crear una suscripción con categoría que no existe',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId: 9999,
					currencyCode: 'USD',
					name: 'Netflix',
					cost: 12.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(404);
		},
	);

	it(
		'Debería retornar error al crear suscripción con categoría de otro usuario',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId: otherCategoryId,
					currencyCode: 'USD',
					name: 'Hulu',
					cost: 9.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(403);
		},
	);

	it(
		'Debería retornar error al crear una suscripción con código de moneda inválido',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'MXN', // Código de moneda inválido por que no existe en la tabla de currencies
					name: 'Disney+',
					cost: 7.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(404);
		},
	);

	it(
		'Debería retornar errores de validación al crear una suscripción con datos inválidos',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: '', // Nombre inválido (vacío)
					cost: -5, // Costo inválido (negativo)
					costType: 'INVALID_TYPE', // Tipo de costo inválido
					billingFrequency: 0, // Frecuencia de facturación inválida (no positiva)
					billingUnit: 'INVALID_UNIT', // Unidad de facturación inválida
					firstPaymentDate: 'invalid-date', // Fecha inválida
				})
				.expect(422);
		},
	);

	it(
		'Debería rechazar costos con más de 2 decimales',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Service with 3 decimals',
					cost: 10.999,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(422);
		},
	);

	it(
		'Debería rechazar nombre mayor a 100 caracteres',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'A'.repeat(101),
					cost: 10,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(422);
		},
	);

	it(
		'Debería retornar un array de todas las suscripciones del usuario',
		{ timeout: 10000 },
		async () => {
			const res = await request(env.getApp())
				.get('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(200)
				.expect('Content-Type', /json/);

			assert(Array.isArray(res.body.data.subscriptions));
			assert.equal(typeof res.body.meta.hasNextPage, 'boolean');
			assert(
				res.body.meta.nextCursor === null ||
					typeof res.body.meta.nextCursor === 'string',
			);
			// Verificar que cada suscripción tenga el userId correcto
			res.body.data.subscriptions.forEach((sub: { userId: string }) => {
				assert.strictEqual(
					sub.userId,
					user.id,
					'Cada suscripción debe pertenecer al usuario autenticado',
				);
			});
		},
	);

	it(
		'Debería paginar suscripciones usando cursor y limit',
		{ timeout: 10000 },
		async () => {
			for (let i = 0; i < 3; i++) {
				await request(env.getApp())
					.post('/api/v1/subscriptions')
					.set('Origin', 'http://localhost:3000')
					.set('Cookie', cookie)
					.send({
						categoryId,
						currencyCode: 'USD',
						name: `Cursor test ${Date.now()}-${i}`,
						cost: 10 + i,
						costType: 'FIXED',
						billingFrequency: 1,
						billingUnit: 'MONTHS',
						firstPaymentDate: new Date().toISOString(),
					})
					.expect(201);
			}

			const firstPage = await request(env.getApp())
				.get('/api/v1/subscriptions?limit=2')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(200)
				.expect('Content-Type', /json/);

			assert(Array.isArray(firstPage.body.data.subscriptions));
			assert.strictEqual(firstPage.body.data.subscriptions.length, 2);
			assert.strictEqual(firstPage.body.meta.hasNextPage, true);
			assert.equal(typeof firstPage.body.meta.nextCursor, 'string');

			const firstPageIds = new Set(
				firstPage.body.data.subscriptions.map((sub: { id: string }) => sub.id),
			);

			const secondPage = await request(env.getApp())
				.get(
					`/api/v1/subscriptions?limit=2&cursor=${firstPage.body.meta.nextCursor}`,
				)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(200)
				.expect('Content-Type', /json/);

			assert(Array.isArray(secondPage.body.data.subscriptions));
			assert(secondPage.body.data.subscriptions.length <= 2);
			secondPage.body.data.subscriptions.forEach((sub: { id: string }) => {
				assert.strictEqual(firstPageIds.has(sub.id), false);
			});
		},
	);

	it(
		'Debería validar query params de paginación cursor-based',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.get('/api/v1/subscriptions?limit=101')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(422);

			await request(env.getApp())
				.get('/api/v1/subscriptions?cursor=not-a-uuidv7')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(422);
		},
	);

	it(
		'Deberíá retornar una suscripción específica por ID',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Amazon Prime',
					cost: 12.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			const res = await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(200)
				.expect('Content-Type', /json/);

			assert.strictEqual(res.body.data.id, subscriptionId);
		},
	);

	it(
		'Debería retornar error al intentar obtener una suscripción que no pertenece al usuario',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Apple Music',
					cost: 9.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie)
				.expect(403);
		},
	);

	it(
		'Debería retornar error al intentar obtener una suscripción que no existe',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.get('/api/v1/subscriptions/019c11ae-276d-7528-bde9-7bcbe8047caf')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(404);
		},
	);

	it(
		'Debería actualizar una suscripción existente',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'HBO Max',
					cost: 14.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			const res = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					name: 'HBO Max Updated',
					cost: 19.99,
				})
				.expect(200)
				.expect('Content-Type', /json/);

			assert.strictEqual(res.body.data.name, 'HBO Max Updated');
			assert.strictEqual(res.body.data.cost, '19.99');
		},
	);

	it(
		'Debería actualizar firstPaymentDate al actualizar trialEndsOn',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			const newTrialEndDate = new Date();
			newTrialEndDate.setDate(newTrialEndDate.getDate() + 7);

			const res = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					trialEndsOn: newTrialEndDate.toISOString(),
				})
				.expect(200)
				.expect('Content-Type', /json/);

			assert.strictEqual(
				res.body.data.firstPaymentDate,
				res.body.data.trialEndsOn,
				'firstPaymentDate no se actualizó al cambiar trialEndsOn',
			);
		},
	);

	it(
		'Debería retornar error al intentar actualizar una suscripción de otro usuario',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie)
				.send({
					name: 'Updated Name',
				})
				.expect(403);
		},
	);

	it(
		'Deberia retornar un error al usar una categoria que no pertenece al usuario al actualizar una suscripción',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId: otherCategoryId,
				})
				.expect(403);
		},
	);

	it(
		'Debería eliminar una suscripción existente',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			await request(env.getApp())
				.delete(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(204);

			// Verificar que la suscripción ya no existe
			await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(404);
		},
	);

	it(
		'Debería retornar error al intentar eliminar una suscripción de otro usuario',
		{ timeout: 10000 },
		async () => {
			const createRes = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				})
				.expect(201);

			const subscriptionId = createRes.body.data.id;

			await request(env.getApp())
				.delete(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie)
				.expect(403);
		},
	);

	it(
		'Debería retornar error al intentar eliminar una suscripción que no existe',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.delete('/api/v1/subscriptions/019c11ae-276d-7528-bde9-7bcbe8047caf')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.expect(404);
		},
	);
});
