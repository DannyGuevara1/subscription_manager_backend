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

	before(async () => {
		const newUser = {
			email: 'newUser@test.com',
			password: 'password123',
			name: 'Test User',
			primaryCurrencyCode: 'USD',
		};

		const credentials = await loginAsUser(env.getApp(), newUser);

		cookie = credentials.cookie;
		user = credentials.user;
	});

	it(
		'Debería poder crear una categoria a un usuario',
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
		},
	);
});
