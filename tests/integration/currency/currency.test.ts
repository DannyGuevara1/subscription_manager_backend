import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Moneda - Pruebas de Integración', () => {
	const env = setupIntegrationEnvironment();

	let cookie: string;
	let user: SafeUserAuthDto;
	let categoryId: number;

	let otherUserCookie: string;
	let otherUser: SafeUserAuthDto;

	before(async () => {
		const newUser = {
			email: 'newUser@test.com',
			password: 'password123',
			name: 'Test User',
			primaryCurrencyCode: 'USD',
		};

		const credentials = await loginAsUser(env.getApp(), newUser);

		const otherUserMock = {
			email: 'otherUser@test.com',
			password: 'password123',
			name: 'Other User',
			primaryCurrencyCode: 'USD',
		};

		const otherUserCredentials = await loginAsUser(env.getApp(), otherUserMock);

		otherUserCookie = otherUserCredentials.cookie;
		otherUser = otherUserCredentials.user;

		cookie = credentials.cookie;
		user = credentials.user;
	});

	// GET /currencies
	it('Debería obtener la lista de monedas', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/currencies')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200);
	});

	// GET /currencies/:code
	it('Debería obtener los detalles de una moneda por su código', async () => {
		const _res = await request(env.getApp())
			.get('/api/v1/currencies/USD')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200);
	});

	it('Debería retornar 404 si la moneda no existe', async () => {
		const _res = await request(env.getApp())
			.get('/api/v1/currencies/XXX')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(404);
	});

	// POST /currencies
	it('Debería crear una nueva moneda', async () => {
		const newCurrency = {
			code: 'JPY',
			name: 'Yen Japonés',
			symbol: '¥',
		};
		const res = await request(env.getApp())
			.post('/api/v1/currencies')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send(newCurrency)
			.expect(201);

		assert.strictEqual(res.body.data.code, newCurrency.code);
		assert.strictEqual(res.body.data.name, newCurrency.name);
		assert.strictEqual(res.body.data.symbol, newCurrency.symbol);
	});

	it('Debería retornar 409 si la moneda ya existe', async () => {
		const existingCurrency = {
			code: 'USD',
			name: 'Dólar Estadounidense',
			symbol: '$',
		};
		const res = await request(env.getApp())
			.post('/api/v1/currencies')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send(existingCurrency)
			.expect(409);
	});

	it('Debería actualizar una moneda existente', async () => {
		const updatedCurrency = {
			name: 'Dólar US',
			symbol: 'US$',
		};
		const res = await request(env.getApp())
			.put('/api/v1/currencies/USD')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send(updatedCurrency)
			.expect(200);

		assert.strictEqual(res.body.data.code, 'USD');
		assert.strictEqual(res.body.data.name, updatedCurrency.name);
		assert.strictEqual(res.body.data.symbol, updatedCurrency.symbol);
	});

	it('Debería retornar 404 al intentar actualizar una moneda que no existe', async () => {
		const updatedCurrency = {
			name: 'Moneda Inexistente',
			symbol: 'XXX',
		};
		const res = await request(env.getApp())
			.put('/api/v1/currencies/XXX')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send(updatedCurrency)
			.expect(404);
	});
});
