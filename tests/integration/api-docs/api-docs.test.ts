import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('API Docs - Swagger UI', () => {
	const env = setupIntegrationEnvironment();
	let cookie: string;

	before(async () => {
		const credentials = await loginAsUser(env.getApp(), {
			email: 'docsuser@test.com',
			password: 'password123',
			name: 'Docs Test User',
			primaryCurrencyCode: 'USD',
		});
		cookie = credentials.cookie;
	});

	it('Debería servir la UI de Swagger en /api/v1/api-docs/', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/api-docs/')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /html/);

		assert.ok(
			res.text.includes('swagger-ui'),
			'La respuesta debe contener el contenedor de Swagger UI',
		);
		assert.ok(
			res.text.includes('swagger-ui-bundle.js'),
			'La respuesta debe cargar el bundle de Swagger UI',
		);
	});

	it('Debería servir el spec OpenAPI en /api/v1/api-docs/openapi.yaml', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/api-docs/openapi.yaml')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /yaml/);

		assert.ok(
			res.text.includes('openapi:'),
			'El spec debe declarar la versión de OpenAPI',
		);
		assert.ok(
			res.text.includes('Subscription Manager API'),
			'El spec debe contener el título de la API',
		);
	});

	it('Debería rechazar acceso a /api/v1/api-docs sin token', async () => {
		await request(env.getApp())
			.get('/api/v1/api-docs/')
			.set('Origin', 'http://localhost:3000')
			.expect(401);
	});
});
