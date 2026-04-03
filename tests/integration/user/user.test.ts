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
	it('Debería obtener usuarios paginados con valores por defecto', async () => {
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
		assert.strictEqual(
			res.body.meta.currentPage,
			1,
			'La página por defecto debe ser 1',
		);
		assert.strictEqual(
			res.body.meta.limit,
			10,
			'El límite por defecto debe ser 10',
		);
		assert.strictEqual(
			typeof res.body.meta.totalItems,
			'number',
			'La metadata debe incluir totalItems',
		);
		assert.strictEqual(
			typeof res.body.meta.totalPages,
			'number',
			'La metadata debe incluir totalPages',
		);
		assert.strictEqual(
			res.body.meta.hasPreviousPage,
			false,
			'En la primera página no debe haber página previa',
		);
		assert(
			res.body.data.users.length >= 2,
			'Debe haber al menos dos usuarios en la respuesta',
		);
		assert(
			res.body.data.users.length <= 10,
			'La respuesta no debe exceder el límite por defecto',
		);
	});

	it('Debería respetar los parámetros page y limit en el listado de usuarios', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/users?page=1&limit=1')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.users.length,
			1,
			'Con limit=1 solo debe devolverse un usuario',
		);
		assert.strictEqual(res.body.meta.currentPage, 1);
		assert.strictEqual(res.body.meta.limit, 1);
		assert(
			res.body.meta.totalItems >= 1,
			'totalItems debe reflejar el total de usuarios',
		);
	});

	it('Debe retornar 422 cuando page es menor que 1', async () => {
		await request(env.getApp())
			.get('/api/v1/users?page=0&limit=10')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(422);
	});

	it('Debe retornar 422 cuando limit excede el máximo permitido', async () => {
		await request(env.getApp())
			.get('/api/v1/users?page=1&limit=101')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.expect(422);
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

	it('Debe retornar 403 cuando un USER intenta consultar otro usuario existente', async () => {
		await request(env.getApp())
			.get(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.expect(403);
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
		assert.strictEqual(
			res.body.data.primaryCurrencyCode,
			'USD',
			'SUPPORT debe recibir la moneda primaria',
		);
		assert.strictEqual(
			res.body.data.email,
			undefined,
			'SUPPORT no debe recibir email en el perfil',
		);
		assert.strictEqual(
			res.body.data.name,
			undefined,
			'SUPPORT no debe recibir nombre en el perfil',
		);
		assert.strictEqual(
			res.body.data.role,
			undefined,
			'SUPPORT no debe recibir rol en el perfil',
		);
		assert.strictEqual(
			res.body.data.createdAt,
			undefined,
			'SUPPORT no debe recibir createdAt en el perfil',
		);
		assert.strictEqual(
			res.body.data.updatedAt,
			undefined,
			'SUPPORT no debe recibir updatedAt en el perfil',
		);
		assert.strictEqual(
			res.body.data.password,
			undefined,
			'SUPPORT no debe recibir password en el perfil',
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

	it('Debe permitir que ADMIN actualice el perfil de otro usuario', async () => {
		const updatedData = {
			name: 'Updated by Admin',
			primaryCurrencyCode: 'USD',
		};

		const res = await request(env.getApp())
			.put(`/api/v1/users/${otherUser.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.send(updatedData)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			otherUser.id,
			'ADMIN debe poder actualizar cualquier usuario',
		);
		assert.strictEqual(res.body.data.name, updatedData.name);
	});

	it('Debe permitir que SUPPORT actualice campos no sensibles de otro usuario', async () => {
		const updatedData = {
			name: 'Updated by Support',
			primaryCurrencyCode: 'EUR',
		};

		const res = await request(env.getApp())
			.put(`/api/v1/users/${otherUser.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', supportCookie)
			.send(updatedData)
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			res.body.data.id,
			otherUser.id,
			'SUPPORT debe poder actualizar campos no sensibles',
		);
		assert.strictEqual(
			res.body.data.primaryCurrencyCode,
			updatedData.primaryCurrencyCode,
			'SUPPORT debe recibir solo el contrato mínimo del perfil',
		);
		assert.strictEqual(
			res.body.data.email,
			undefined,
			'SUPPORT no debe recibir email al actualizar otro usuario',
		);
		assert.strictEqual(
			res.body.data.name,
			undefined,
			'SUPPORT no debe recibir nombre al actualizar otro usuario',
		);
		assert.strictEqual(
			res.body.data.password,
			undefined,
			'SUPPORT no debe recibir password al actualizar otro usuario',
		);
	});

	it('Debe bloquear a SUPPORT al intentar actualizar email o password de otro usuario', async () => {
		await request(env.getApp())
			.put(`/api/v1/users/${otherUser.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', supportCookie)
			.send({ email: 'blocked-by-support@test.com' })
			.expect(403);
	});

	it('Debe impedir que un USER cambie roles usando el endpoint dedicado', async () => {
		await request(env.getApp())
			.patch(`/api/v1/users/${otherUser.id}/role`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.send({ role: 'SUPPORT' })
			.expect(403);
	});

	it('Debe permitir que ADMIN cambie rol y revocar refresh token previo del usuario objetivo', async () => {
		const roleRes = await request(env.getApp())
			.patch(`/api/v1/users/${otherUser.id}/role`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', adminCookie)
			.send({ role: 'SUPPORT' })
			.expect(200)
			.expect('Content-Type', /json/);

		assert.strictEqual(
			roleRes.body.data.role,
			'SUPPORT',
			'El rol debe actualizarse correctamente',
		);

		await request(env.getApp())
			.post('/api/v1/auth/refresh-token')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', otherUserCookie)
			.expect(401);
	});

	it('Debe eliminar el usuario', async () => {
		await request(env.getApp())
			.delete(`/api/v1/users/${user.id}`)
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(204);
	});
});
