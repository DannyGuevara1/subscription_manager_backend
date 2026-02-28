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
	let otherUser: SafeUserAuthDto;
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
				userId: user.id,
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
		otherUser = otherData.user;

		const otherCatResp = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.send({
				userId: otherUser.id,
				name: 'Entertainment',
			});
		otherCategoryId = otherCatResp.body.data.id;
	});

	it('Debería crear una nueva suscripción', { timeout: 10000 }, async () => {
		const response = await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({
				userId: user.id,
				categoryId,
				currencyCode: 'USD',
				name: 'Spotify',
				cost: 15.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date().toISOString(),
			});

		assert.strictEqual(response.status, 201);

		const sub = response.body.data;
		assert(sub.id);
		assert.strictEqual(sub.userId, user.id);
		assert.strictEqual(sub.categoryId, categoryId);
		assert.strictEqual(sub.currencyCode, 'USD');
		assert.strictEqual(sub.name, 'Spotify');
		assert.strictEqual(sub.cost, 15.99);
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

			const response = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Trial Service',
					cost: 15.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(), // será sobreescrito
					trialEndsOn: trialEnd.toISOString(),
				});

			assert.strictEqual(response.status, 201);
			assert.strictEqual(
				response.body.data.firstPaymentDate,
				trialEnd.toISOString(),
				'firstPaymentDate debe coincidir con trialEndsOn',
			);
			assert.strictEqual(
				response.body.data.firstPaymentDate,
				response.body.data.trialEndsOn,
			);
		},
	);

	it(
		'Debería retornar error al crear una suscripción con categoría que no existe',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId: 9999, // ID de categoría que no existe
					currencyCode: 'USD',
					name: 'Netflix',
					cost: 12.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			assert.strictEqual(response.status, 404);
		},
	);

	it(
		'Debería retornar error al crear suscripción con categoría de otro usuario',
		{ timeout: 10000 },
		async () => {
			// El usuario original intenta usar la categoría del otro usuario
			const subscriptionResponse = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId: otherCategoryId, // Categoría del otro usuario
					currencyCode: 'USD',
					name: 'Hulu',
					cost: 9.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});
			assert.strictEqual(subscriptionResponse.status, 403);
		},
	);

	it(
		'Debería retornar error al crear una suscripción con código de moneda inválido',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'MXN', // Código de moneda inválido por que no existe en la tabla de currencies
					name: 'Disney+',
					cost: 7.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			assert.strictEqual(response.status, 404);
		},
	);

	it(
		'Debería retornar errores de validación al crear una suscripción con datos inválidos',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: '', // Nombre inválido (vacío)
					cost: -5, // Costo inválido (negativo)
					costType: 'INVALID_TYPE', // Tipo de costo inválido
					billingFrequency: 0, // Frecuencia de facturación inválida (no positiva)
					billingUnit: 'INVALID_UNIT', // Unidad de facturación inválida
					firstPaymentDate: 'invalid-date', // Fecha inválida
				});

			assert.strictEqual(response.status, 422);
		},
	);

	it(
		'Debería rechazar nombre mayor a 100 caracteres',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'A'.repeat(101),
					cost: 10,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			assert.strictEqual(response.status, 422);
		},
	);

	it(
		'Debería retornar un array de todas las suscripciones',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.get('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(response.status, 200);
			assert(Array.isArray(response.body.data.subscriptions));
		},
	);

	it(
		'Deberíá retornar una suscripción específica por ID',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Amazon Prime',
					cost: 12.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const subscriptionResponseById = await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(subscriptionResponseById.status, 200);
			assert.strictEqual(subscriptionResponseById.body.data.id, subscriptionId);
		},
	);

	it(
		'Debería retornar error al intentar obtener una suscripción que no pertenece al usuario',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Apple Music',
					cost: 9.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const subscriptionResponseById = await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie);

			assert.strictEqual(subscriptionResponseById.status, 403);
		},
	);

	it(
		'Debería retornar error al intentar obtener una suscripción que no existe',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.get('/api/v1/subscriptions/019c11ae-276d-7528-bde9-7bcbe8047caf') // ID de suscripción que no existe
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(response.status, 404);
		},
	);

	it(
		'Debería actualizar una suscripción existente',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'HBO Max',
					cost: 14.99,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const updateResponse = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					name: 'HBO Max Updated',
					cost: 19.99,
				});

			assert.strictEqual(updateResponse.status, 200);
			assert.strictEqual(updateResponse.body.data.name, 'HBO Max Updated');
			assert.strictEqual(updateResponse.body.data.cost, 19.99);
		},
	);

	it(
		'Debería actualizar firstPaymentDate al actualizar trialEndsOn',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const newTrialEndDate = new Date();
			newTrialEndDate.setDate(newTrialEndDate.getDate() + 7); // Agregar 7 días al trialEndsOn

			const updateResponse = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					trialEndsOn: newTrialEndDate.toISOString(),
				});

			assert.strictEqual(updateResponse.status, 200);
			assert.strictEqual(
				updateResponse.body.data.firstPaymentDate,
				updateResponse.body.data.trialEndsOn,
				'firstPaymentDate no se actualizó al cambiar trialEndsOn',
			);
		},
	);

	it(
		'Debería retornar error al intentar actualizar una suscripción de otro usuario',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const updateResponse = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie)
				.send({
					name: 'Updated Name',
				});

			assert.strictEqual(updateResponse.status, 403);
		},
	);

	it(
		'Deberia retornar un error al usar una categoria que no pertenece al usuario al actualizar una suscripción',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const updateResponse = await request(env.getApp())
				.put(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					categoryId: otherCategoryId, // Intentar actualizar con una categoría que no pertenece al usuario
				});

			assert.strictEqual(updateResponse.status, 403);
		},
	);

	it(
		'Debería eliminar una suscripción existente',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const deleteResponse = await request(env.getApp())
				.delete(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(deleteResponse.status, 200);

			// Verificar que la suscripción ya no existe
			const getResponse = await request(env.getApp())
				.get(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(getResponse.status, 404);
		},
	);

	it(
		'Debería retornar error al intentar eliminar una suscripción de otro usuario',
		{ timeout: 10000 },
		async () => {
			const subscriptionCreated = await request(env.getApp())
				.post('/api/v1/subscriptions')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.send({
					userId: user.id,
					categoryId,
					currencyCode: 'USD',
					name: 'Test Subscription',
					cost: 10.0,
					costType: 'FIXED',
					billingFrequency: 1,
					billingUnit: 'MONTHS',
					firstPaymentDate: new Date().toISOString(),
				});

			const subscriptionId = subscriptionCreated.body.data.id;

			const deleteResponse = await request(env.getApp())
				.delete(`/api/v1/subscriptions/${subscriptionId}`)
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', otherUserCookie); // Intentar eliminar con la cookie del otro usuario

			assert.strictEqual(deleteResponse.status, 403);
		},
	);

	it(
		'Debería retornar error al intentar eliminar una suscripción que no existe',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.delete('/api/v1/subscriptions/019c11ae-276d-7528-bde9-7bcbe8047caf') // ID de suscripción que no existe
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie);

			assert.strictEqual(response.status, 404);
		},
	);
});
