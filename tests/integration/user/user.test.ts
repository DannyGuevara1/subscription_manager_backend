import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import {
	loginAsAdmin,
	loginAsSupport,
	loginAsUser,
} from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Usuario - Pruebas de Integración', () => {
	const env = setupIntegrationEnvironment();

	let cookie: string;
	let user: SafeUserAuthDto;

	let otherUserCookie: string;
	let otherUser: SafeUserAuthDto;

	let adminCookie: string;
	let supportCookie: string;

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

		const adminCredentials = await loginAsAdmin(env.getApp());
		adminCookie = adminCredentials.cookie;

		const supportCredentials = await loginAsSupport(env.getApp());
		supportCookie = supportCredentials.cookie;

		otherUserCookie = otherUserCredentials.cookie;
		otherUser = otherUserCredentials.user;

		cookie = credentials.cookie;
		user = credentials.user;
	});

	// GET /users
	it('Debería obtener todos los usuarios', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/users')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert(
			Array.isArray(res.body.data.users),
			'La respuesta debe ser un array',
		);
		assert(
			res.body.data.users.length >= 2,
			'Debe haber al menos dos usuarios en la respuesta',
		);
	});

	// GET /users/:id
	it('Debe obtener los detalles de un usuario por su ID', async () => {
		const res = await request(env.getApp())
			.get(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			user.id,
			'El ID del usuario debe coincidir',
		);
		assert.strictEqual(
			res.body.data.email,
			user.email,
			'El email del usuario debe coincidir',
		);
		assert.strictEqual(
			res.body.data.password,
			undefined,
			'La contraseña no debe ser incluida en la respuesta',
		);
	});

	it('Debe retornar 404 si el usuario no existe', async () => {
		await request(env.getApp())
			.get('/api/v1/users/019c6916-20df-7abd-88f6-253598ca41c2')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(404);
	});

	it('Debe retornar 404 cuando un USER intenta consultar otro usuario existente', async () => {
		await request(env.getApp())
			.get(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.expect(404);
	});

	it('Debe permitir que ADMIN consulte el perfil de cualquier usuario', async () => {
		const res = await request(env.getApp())
			.get(`/api/v1/users/${otherUser.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			otherUser.id,
			'ADMIN debe poder consultar cualquier usuario por ID',
		);
	});

	it('Debe permitir que SUPPORT consulte el perfil de cualquier usuario', async () => {
		const res = await request(env.getApp())
			.get(`/api/v1/users/${otherUser.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', supportCookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			otherUser.id,
			'SUPPORT debe poder consultar cualquier usuario por ID',
		);
	});

	// PUT /users/:id
	it('Debe actualizar el perfil del usuario', async () => {
		const updatedData = {
			name: 'Updated Test User',
			primaryCurrencyCode: 'EUR',
		};

		const res = await request(env.getApp())
			.put(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send(updatedData)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.ok(res.body?.data, 'La respuesta debe incluir data');
		assert.strictEqual(res.body.data.id, user.id);
		assert.strictEqual(res.body.data.name, updatedData.name);
		assert.strictEqual(
			res.body.data.primaryCurrencyCode,
			updatedData.primaryCurrencyCode,
		);
		assert.strictEqual(
			res.body.data.password,
			undefined,
			'La contraseña no debe devolverse nunca',
		);
	});

	it('Debe iniciar sessión con la nueva password después de actualizar el perfil', async () => {
		const newPassword = 'newPassword123';

		// Actualizar la contraseña del usuario
		await request(env.getApp())
			.put(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({ password: newPassword })
			.expect(200);

		// Intentar iniciar sesión con la nueva contraseña
		const loginRes = await request(env.getApp())
			.post('/api/v1/auth/login')
			.set('Origin', 'http://localhost:3000')
			.send({
				email: user.email,
				password: newPassword,
			})
			.expect(200);

		assert.ok(loginRes.body.data, 'La respuesta de login debe incluir data');
	});

	it('Debe retornar 403 al intentar actualizar el perfil de otro usuario', async () => {
		const updatedData = {
			name: 'Malicious Update',
			primaryCurrencyCode: 'EUR',
		};

		await request(env.getApp())
			.put(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.send(updatedData)
			.expect(403);
	});

	it('Debe eliminar el usuario', async () => {
		const res = await request(env.getApp())
			.delete(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			user.id,
			'El ID del usuario eliminado debe coincidir',
		);
	});
});
