import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('Modulo de categorias', () => {
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

	// ──────────────────────────────────────────────
	// AUTENTICACIÓN
	// ──────────────────────────────────────────────

	it(
		'Debería retornar 401 al intentar acceder sin autenticación',
		{ timeout: 10000 },
		async () => {
			const responseGetCategories = await request(env.getApp())
				.get('/api/v1/categories')
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategories.status, 401);
		},
	);

	it(
		'Debería retornar 401 al intentar crear una categoría sin autenticación',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Origin', 'http://localhost:3000')
				.send({ userId: '019c11ae-276d-7528-bde9-7bcbe8047caf', name: 'test' });

			assert.strictEqual(responseCreateCategory.status, 401);
		},
	);

	// ──────────────────────────────────────────────
	// VALIDACIÓN DE INPUT — CREATE
	// ──────────────────────────────────────────────

	it(
		'Debería retornar error de validación al crear sin campo name',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
				});

			assert.ok(
				[422].includes(responseCreateCategory.status),
				`Esperaba 422, obtuvo ${responseCreateCategory.status}`,
			);
		},
	);

	it(
		'Debería retornar error de validación al crear con name vacío',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
					name: '',
				});

			assert.ok(
				[422].includes(responseCreateCategory.status),
				`Esperaba 422, obtuvo ${responseCreateCategory.status}`,
			);
		},
	);

	it(
		'Debería retornar error de validación al crear con name mayor a 100 caracteres',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
					name: 'a'.repeat(101),
				});

			assert.ok(
				[422].includes(responseCreateCategory.status),
				`Esperaba 422, obtuvo ${responseCreateCategory.status}`,
			);
		},
	);

	it(
		'Debería retornar error de validación al crear sin campo userId',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					name: 'test category',
				});

			assert.ok(
				[422].includes(responseCreateCategory.status),
				`Esperaba 422, obtuvo ${responseCreateCategory.status}`,
			);
		},
	);

	it(
		'Debería retornar error de validación al crear con userId de formato inválido',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: 'no-es-un-uuid-valido',
					name: 'test category',
				});

			assert.ok(
				[422].includes(responseCreateCategory.status),
				`Esperaba 422, obtuvo ${responseCreateCategory.status}`,
			);
		},
	);

	// ──────────────────────────────────────────────
	// VALIDACIÓN DE INPUT — PARAMS
	// ──────────────────────────────────────────────

	it(
		'Debería retornar error de validación al acceder con ID de categoría no numérico',
		{ timeout: 10000 },
		async () => {
			const responseGetCategory = await request(env.getApp())
				.get('/api/v1/categories/abc')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.ok(
				[422].includes(responseGetCategory.status),
				`Esperaba 422, obtuvo ${responseGetCategory.status}`,
			);
		},
	);

	// ──────────────────────────────────────────────
	// CREATE
	// ──────────────────────────────────────────────

	it(
		'Debería poder crear una categoría a un usuario',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
					name: 'new category',
				});

			assert.strictEqual(responseCreateCategory.status, 201);

			const data = responseCreateCategory.body.data;
			assert.ok(data.id, 'La respuesta debe contener un id');
			assert.strictEqual(data.name, 'new category');
			assert.strictEqual(data.userId, user.id);

			categoryId = data.id;
		},
	);

	it(
		'Debería retornar un error al intentar crear una categoría con un nombre que ya existe para el mismo usuario',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
					name: 'new category',
				});

			assert.strictEqual(responseCreateCategory.status, 409);
		},
	);

	it(
		'Debería retornar un error al intentar crear una categoría para un usuario que no existe',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: '019c11ae-276d-7528-bde9-7bcbe8047caf',
					name: 'nonexistent user category',
				});

			assert.strictEqual(responseCreateCategory.status, 404);
		},
	);

	// ──────────────────────────────────────────────
	// GET ALL
	// ──────────────────────────────────────────────

	it(
		'Debería retornar todas las categorías del usuario que ha iniciado sesión',
		{ timeout: 10000 },
		async () => {
			const responseGetCategories = await request(env.getApp())
				.get('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategories.status, 200);

			const categories = responseGetCategories.body.data.categories;
			assert.ok(Array.isArray(categories), 'La respuesta debe ser un array');
			assert.ok(categories.length >= 1, 'Debe tener al menos 1 categoría');

			// Verificar que todas pertenecen al usuario autenticado
			for (const category of categories) {
				assert.strictEqual(
					category.userId,
					user.id,
					'Cada categoría debe pertenecer al usuario autenticado',
				);
			}
		},
	);

	it(
		'Debería retornar solo las categorías del usuario autenticado, no las de otros usuarios',
		{ timeout: 10000 },
		async () => {
			// Crear una categoría para el otro usuario
			const responseOtherCreate = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', otherUserCookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: otherUser.id,
					name: 'other user category',
				});
			assert.strictEqual(responseOtherCreate.status, 201);

			// Obtener las categorías del usuario principal
			const responseGetCategories = await request(env.getApp())
				.get('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategories.status, 200);

			const categories = responseGetCategories.body.data.categories;
			const otherUserCategories = categories.filter(
				(c: { userId: string }) => c.userId === otherUser.id,
			);

			assert.strictEqual(
				otherUserCategories.length,
				0,
				'No debe contener categorías de otros usuarios',
			);
		},
	);

	// ──────────────────────────────────────────────
	// GET BY ID
	// ──────────────────────────────────────────────

	it(
		'Debería retornar una categoría por su ID',
		{ timeout: 10000 },
		async () => {
			const responseGetCategory = await request(env.getApp())
				.get(`/api/v1/categories/${categoryId}`)
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategory.status, 200);

			const data = responseGetCategory.body.data;
			assert.strictEqual(data.id, categoryId);
			assert.strictEqual(data.userId, user.id);
			assert.strictEqual(typeof data.name, 'string');
		},
	);

	it(
		'Debería retornar un error al intentar obtener una categoría que no pertenece al usuario',
		{ timeout: 10000 },
		async () => {
			const responseGetCategory = await request(env.getApp())
				.get(`/api/v1/categories/${categoryId}`)
				.set('Cookie', otherUserCookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategory.status, 403);
		},
	);

	// ──────────────────────────────────────────────
	// UPDATE
	// ──────────────────────────────────────────────

	it('Debería poder actualizar una categoría', { timeout: 10000 }, async () => {
		const responseUpdateCategory = await request(env.getApp())
			.put(`/api/v1/categories/${categoryId}`)
			.set('Cookie', cookie)
			.set('Origin', 'http://localhost:3000')
			.send({
				name: 'updated category',
			});

		assert.strictEqual(responseUpdateCategory.status, 200);

		const data = responseUpdateCategory.body.data;
		assert.strictEqual(data.id, categoryId);
		assert.strictEqual(data.name, 'updated category');
	});

	it(
		'Debería retornar un error al intentar actualizar una categoría con el mismo nombre de otra categoría del mismo usuario',
		{ timeout: 10000 },
		async () => {
			const responseCreateCategory = await request(env.getApp())
				.post('/api/v1/categories')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					userId: user.id,
					name: 'IA',
				});

			assert.strictEqual(responseCreateCategory.status, 201);

			const responseUpdateCategoryWithSameName = await request(env.getApp())
				.put(`/api/v1/categories/${categoryId}`)
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					name: 'IA',
				});

			assert.strictEqual(responseUpdateCategoryWithSameName.status, 409);
		},
	);

	it(
		'Debería retornar 404 al intentar actualizar una categoría que no existe',
		{ timeout: 10000 },
		async () => {
			const responseUpdateCategory = await request(env.getApp())
				.put('/api/v1/categories/999999')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					name: 'fantasma',
				});

			assert.strictEqual(responseUpdateCategory.status, 404);
		},
	);

	it(
		'Debería retornar error de validación al actualizar con name vacío',
		{ timeout: 10000 },
		async () => {
			const responseUpdateCategory = await request(env.getApp())
				.put(`/api/v1/categories/${categoryId}`)
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000')
				.send({
					name: '',
				});

			assert.ok(
				[422].includes(responseUpdateCategory.status),
				`Esperaba 422, obtuvo ${responseUpdateCategory.status}`,
			);
		},
	);

	// ──────────────────────────────────────────────
	// DELETE
	// ──────────────────────────────────────────────

	it(
		'Debería retornar un error al intentar eliminar una categoría que no pertenece al usuario',
		{ timeout: 10000 },
		async () => {
			const responseDeleteCategory = await request(env.getApp())
				.delete(`/api/v1/categories/${categoryId}`)
				.set('Cookie', otherUserCookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseDeleteCategory.status, 403);
		},
	);

	it(
		'Debería retornar 404 al intentar eliminar una categoría que no existe',
		{ timeout: 10000 },
		async () => {
			const responseDeleteCategory = await request(env.getApp())
				.delete('/api/v1/categories/999999')
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseDeleteCategory.status, 404);
		},
	);

	it('Debería poder eliminar una categoría', { timeout: 10000 }, async () => {
		const responseDeleteCategory = await request(env.getApp())
			.delete(`/api/v1/categories/${categoryId}`)
			.set('Cookie', cookie)
			.set('Origin', 'http://localhost:3000');

		assert.strictEqual(responseDeleteCategory.status, 200);

		const data = responseDeleteCategory.body.data;
		assert.strictEqual(data.id, categoryId);
	});

	it(
		'Debería retornar 404 al intentar obtener una categoría que fue eliminada',
		{ timeout: 10000 },
		async () => {
			const responseGetCategory = await request(env.getApp())
				.get(`/api/v1/categories/${categoryId}`)
				.set('Cookie', cookie)
				.set('Origin', 'http://localhost:3000');

			assert.strictEqual(responseGetCategory.status, 404);
		},
	);
});
