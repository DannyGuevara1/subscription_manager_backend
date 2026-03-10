import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { loginAsUser } from 'tests/setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Autenticación y registro', () => {
	const env = setupIntegrationEnvironment();
	let cookie: string;
	let user: any;

	before(async () => {
		const newUser = {
			email: 'test2@example.com',
			password: 'password123',
			name: 'Test User',
			primaryCurrencyCode: 'USD',
		};

		const credentials = await loginAsUser(env.getApp(), newUser);
		cookie = credentials.cookie;
		user = credentials.user;
	});

	const mockUser = {
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		primaryCurrencyCode: 'USD',
	};

	it('Debe registrar un nuevo usuario', { timeout: 10000 }, async () => {
		const res = await request(env.getApp())
			.post('/api/v1/auth/register')
			.set('Origin', 'http://localhost:3000')
			.send(mockUser)
			.expect(201)
			.expect('Content-Type', /json/);

		assert.ok(res.body.data, 'La respuesta debe incluir data');
	});

	it(
		'Debe iniciar sesión con un usuario registrado',
		{ timeout: 10000 },
		async () => {
			const res = await request(env.getApp())
				.post('/api/v1/auth/login')
				.set('Origin', 'http://localhost:3000')
				.send({
					email: mockUser.email,
					password: mockUser.password,
				})
				.expect(200)
				.expect('Content-Type', /json/);

			assert.ok(res.body.data, 'La respuesta debe incluir data');
		},
	);

	it(
		'Logout debe eliminar la cookie de autenticación request subsecuente debe fallar',
		{ timeout: 10000 },
		async () => {
			const logoutRes = await request(env.getApp())
				.post('/api/v1/auth/logout')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', cookie)
				.set('Accept', 'application/json')
				.expect(200);

			// Verificar que el servidor indica borrar ambas cookies
			const setCookies = logoutRes.headers['set-cookie'] as string[];
			const cleared = setCookies.map((c: string) => c.split('=')[0]);
			console.log('Cookies que el servidor indica limpiar:', cleared);
			assert.ok(
				cleared.includes('ACCESS_TOKEN'),
				'Debe limpiar la cookie ACCESS_TOKEN',
			);
			assert.ok(
				cleared.includes('REFRESH_TOKEN'),
				'Debe limpiar la cookie REFRESH_TOKEN',
			);

			// Sin cookies, el request debe fallar con 401
			await request(env.getApp())
				.get('/api/v1/users')
				.set('Origin', 'http://localhost:3000')
				.expect(401);

			// El refresh token debe haber sido eliminado de Redis
			const existingRefreshToken = await env
				.getRedisClient()
				.exists(`refreshToken:${user.id}`);
			assert.strictEqual(
				existingRefreshToken,
				0,
				'El refresh token debe ser eliminado de Redis',
			);
		},
	);
});
