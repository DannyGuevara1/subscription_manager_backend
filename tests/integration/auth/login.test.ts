import assert from 'node:assert';
import { describe, it } from 'node:test';
import request from 'supertest';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Autenticación y registro', () => {
	const env = setupIntegrationEnvironment();
	const mockUser = {
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		primaryCurrencyCode: 'USD',
	};

	it('Debe registrar un nuevo usuario', { timeout: 10000 }, async () => {
		const response = await request(env.getApp())
			.post('/api/v1/auth/register')
			.set('Origin', 'http://localhost:3000')
			.send(mockUser);

		//console.log('Register response:', response.status, response.body);
		assert.strictEqual(response.status, 201);
		assert(response.body.data);
	});

	it(
		'Debe iniciar sesión con un usuario registrado',
		{ timeout: 10000 },
		async () => {
			const response = await request(env.getApp())
				.post('/api/v1/auth/login')
				.set('Origin', 'http://localhost:3000')
				.send({
					email: mockUser.email,
					password: mockUser.password,
				});

			//console.log('Login response:', response.status, response.body);
			assert.strictEqual(response.status, 200);
			assert(response.body.data);
		},
	);
});
