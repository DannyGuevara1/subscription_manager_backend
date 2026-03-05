import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Módulo de Usuario - Pruebas de Integración', () => {
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

	// GET /users
	it('Debeía obtener todos los usuarios', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/users')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200);

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
		const res = await request(env.getApp())
			.get('/api/v1/users/019c6916-20df-7abd-88f6-253598ca41c2')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(404);
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

		assert.strictEqual(
			res.body.data.name,
			updatedData.name,
			'El nombre del usuario debe ser actualizado',
		);
		assert.strictEqual(
			res.body.data.primaryCurrencyCode,
			updatedData.primaryCurrencyCode,
			'El código de moneda principal del usuario debe ser actualizado',
		);
	});

	it('Debe retornar 403 al intentar actualizar el perfil de otro usuario', async () => {
		const updatedData = {
			name: 'Malicious Update',
			primaryCurrencyCode: 'EUR',
		};

		const _res = await request(env.getApp())
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
			.expect(200);

		assert.strictEqual(
			res.body.data.id,
			user.id,
			'El ID del usuario eliminado debe coincidir',
		);
	});
});
