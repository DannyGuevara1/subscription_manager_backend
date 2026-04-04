import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from 'tests/setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Autenticación y registro', () => {
	const env = setupIntegrationEnvironment();
	let cookie: string;
	let user: SafeUserAuthDto;

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
		'Debe fallar al registrar un usuario con email ya existente',
		{ timeout: 10000 },
		async () => {
			await request(env.getApp())
				.post('/api/v1/auth/register')
				.set('Origin', 'http://localhost:3000')
				.send(mockUser)
				.expect(409)
				.expect('Content-Type', /application\/problem\+json/);
		},
	);

	it('Debe fallar al registrar un email inválido', async () => {
		const invalidUser = { ...mockUser, email: 'invalid-email' };
		await request(env.getApp())
			.post('/api/v1/auth/register')
			.set('Origin', 'http://localhost:3000')
			.send(invalidUser)
			.expect(422)
			.expect('Content-Type', /application\/problem\+json/);
	});

	it('Debe fallar al registrar con un password debil', async () => {
		const invalidUser = { ...mockUser, password: '123' };
		await request(env.getApp())
			.post('/api/v1/auth/register')
			.set('Origin', 'http://localhost:3000')
			.send(invalidUser)
			.expect(422)
			.expect('Content-Type', /application\/problem\+json/);

	});

	it(
		'Debe fallar al registrar con un currencyCode inválido',
		{ timeout: 10000 },
		async () => {
			const invalidUser = {
				...mockUser,
				email: 'invalid@example.com',
				primaryCurrencyCode: 'PCX',
			};
			await request(env.getApp())
				.post('/api/v1/auth/register')
				.set('Origin', 'http://localhost:3000')
				.send(invalidUser)
				.expect(422)
				.expect('Content-Type', /application\/problem\+json/);
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
			const rawCookies = logoutRes.headers['set-cookie'];
			const setCookies = rawCookies
				? Array.isArray(rawCookies)
					? rawCookies
					: [rawCookies]
				: [];
			const cleared = setCookies?.map((c: string) => c.split('=')[0]) || [];

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
	it(
		'Debe emitir un nuevo refresh token válido',
		{ timeout: 10000 },
		async () => {
			// Primero, hacemos login para obtener un refresh token válido
			const loginRes = await request(env.getApp())
				.post('/api/v1/auth/login')
				.set('Origin', 'http://localhost:3000')
				.send({
					email: mockUser.email,
					password: mockUser.password,
				})
				.expect(200);

			const rawCookies = loginRes.headers['set-cookie'];
			const cookies = rawCookies
				? Array.isArray(rawCookies)
					? rawCookies
					: [rawCookies]
				: [];
			assert.ok(cookies, 'Debe recibir cookies en la respuesta de login');
			const refreshTokenCookie = cookies.find((c: string) =>
				c.startsWith('REFRESH_TOKEN='),
			);
			assert.ok(refreshTokenCookie, 'Debe recibir una cookie REFRESH_TOKEN');

			const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
			assert.ok(refreshToken, 'La cookie REFRESH_TOKEN debe contener un valor');

			// Ahora, solicitamos un nuevo access token usando el refresh token
			const refreshRes = await request(env.getApp())
				.post('/api/v1/auth/refresh-token')
				.set('Origin', 'http://localhost:3000')
				.set('Cookie', `REFRESH_TOKEN=${refreshToken}`)
				.expect(200);

			assert.ok(
				refreshRes.body.data,
				'La respuesta de refresh debe incluir data',
			);
		},
	);

	it('Debe rechazar origen no permitido por CORS con 403', async () => {
		await request(env.getApp())
			.post('/api/v1/auth/login')
			.set('Origin', 'http://evil.local')
			.send({
				email: mockUser.email,
				password: mockUser.password,
			})
			.expect(403)
			.expect('Content-Type', /application\/problem\+json/);
	});

	it('Debe rechazar access token con payload inválido aunque esté firmado', async () => {
		const forgedAccessToken = jwt.sign(
			{
				sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
				email: 'admin@example.com',
				name: 'Fake Admin',
				primaryCurrencyCode: 'USD',
				// role omitido a propósito
			},
			process.env.JWT_ACCESS_SECRET as string,
			{ algorithm: 'HS256' },
		);

		await request(env.getApp())
			.get('/api/v1/users')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', `ACCESS_TOKEN=${forgedAccessToken}`)
			.expect(401)
			.expect('Content-Type', /application\/problem\+json/);
	});
});
