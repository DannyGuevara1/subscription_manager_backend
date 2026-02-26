import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
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
	let user: any;
	let categoryId: number;

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
	});

	it('Debería crear una nueva suscripción', async () => {
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
		assert(response.body.data);
	});

	it('firstPaymentDate debe ser autoestablecido si se proporciona trialEndsOn', async () => {
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
				trialEndsOn: new Date().toDateString(),
			});

		assert.strictEqual(response.status, 201);
		assert.strictEqual(
			response.body.data.firstPaymentDate,
			response.body.data.trialEndsOn,
		);
	});

	it('Debería retornar error al crear una suscripción con categoría que no existe', async () => {
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
	});

	it('Crea un nuevo usuario y categoría, luego intenta crear una suscripción con una categoría que no pertenece al usuario', async () => {
		const newUser = {
			email: 'newuser@example.com',
			password: 'password123',
			name: 'New User',
			primaryCurrencyCode: 'USD',
		};
		const data = await loginAsUser(env.getApp(), newUser);

		const newUserCookie = data.cookie;
		const newUserInfo = data.user;

		// Crear una categoría para el nuevo usuario
		const categoryResponse = await request(env.getApp())
			.post('/api/v1/categories')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', newUserCookie)
			.send({
				userId: newUserInfo.id,
				name: 'Entertainment',
			});
		const newCategoryId = categoryResponse.body.data.id;

		// Intentar crear una suscripción para el usuario original usando la categoría del nuevo usuario
		const subscriptionResponse = await request(env.getApp())
			.post('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', newUserCookie)
			.send({
				userId: user.id,
				categoryId: newCategoryId, // Usando la categoría del usuario original
				currencyCode: 'USD',
				name: 'Hulu',
				cost: 9.99,
				costType: 'FIXED',
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				firstPaymentDate: new Date().toISOString(),
			});
		assert.strictEqual(subscriptionResponse.status, 403);
	});

	it('Debería retornar error al crear una suscripción con código de moneda inválido', async () => {
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
	});

	it('Debería retornar errores de validación al crear una suscripción con datos inválidos', async () => {
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
	});

	it('Debería retornar un array de todas las suscripciones', async () => {
		const response = await request(env.getApp())
			.get('/api/v1/subscriptions')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie);

		assert.strictEqual(response.status, 200);
		assert(Array.isArray(response.body.data.subscriptions));
	});
});
