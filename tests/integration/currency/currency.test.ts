import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { loginAsAdmin, loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Moneda - Pruebas de Integración', () => {
	const env = setupIntegrationEnvironment();

	let cookie: string;
	let adminCookie: string;

	before(async () => {
		const newUser = {
			email: 'newUser@test.com',
			password: 'password123',
			name: 'Test User',
			primaryCurrencyCode: 'USD',
		};

		const credentials = await loginAsUser(env.getApp(), newUser);
		cookie = credentials.cookie;

		const adminCredentials = await loginAsAdmin(env.getApp());
		adminCookie = adminCredentials.cookie;
	});

	// GET /currencies
	it('Debería obtener la lista de monedas', async () => {
		await request(env.getApp())
			.get('/api/v1/currencies')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /json/);
	});

	// GET /currencies/:code
	it('Debería obtener los detalles de una moneda por su código', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/currencies/USD')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.ok(res.body.data, 'La respuesta debe contener datos de la moneda');
	});

	it('Debería retornar 404 si la moneda no existe', async () => {
		await request(env.getApp())
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
			.set('Cookie', adminCookie)
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
		await request(env.getApp())
			.post('/api/v1/currencies')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
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
			.set('Cookie', adminCookie)
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
		await request(env.getApp())
			.put('/api/v1/currencies/XXX')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.send(updatedCurrency)
			.expect(404);
	});

	it('Debería eliminar una moneda existente', async () => {
		await request(env.getApp())
			.delete('/api/v1/currencies/JPY')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(204);
	});

	it('Debería retornar un error al eliminar una moneda que esta siendo utilizada', async () => {
		await request(env.getApp())
			.delete('/api/v1/currencies/USD')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(409);
	});

	it('Debería retornar 404 al intentar eliminar una moneda que no existe', async () => {
		await request(env.getApp())
			.delete('/api/v1/currencies/XXX')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(404);
	});
});
