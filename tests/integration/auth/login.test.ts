import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import app from '@/app.js'; // Asegúrate que la ruta sea correcta
import prisma from '@/config/prisma.js';
import redisClient from '@/config/redis.js';
import { containerPromise } from '@/shared/container/container.js'; // Importamos el contenedor

before(async () => {
	await containerPromise; // Esperamos a que el contenedor esté listo
	await redisClient.connect(); // Conectamos a Redis antes de los tests
	await prisma.$connect(); // Conectamos a Prisma antes de los tests
});

describe('Módulo de Autenticación y registro', () => {
	const mockUser = {
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		primaryCurrencyCode: 'USD',
	};
	it('Debe registrar un nuevo usuario', async () => {
		const response = await request(app)
			.post('/api/v1/auth/register')
			.set('Origin', 'http://localhost:3000')
			.send(mockUser);

		assert.strictEqual(response.status, 201);
		assert(response.body.data); // Verificamos que haya un campo data
	});
	it('Debe iniciar sesión con un usuario registrado', async () => {
		const response = await request(app)
			.post('/api/v1/auth/login')
			.set('Origin', 'http://localhost:3000')
			.send({
				email: mockUser.email,
				password: mockUser.password,
			});

		assert.strictEqual(response.status, 200);
		assert(response.body.data); // Verificamos que haya un campo data
	});
});

after(async () => {
	await redisClient.close(); // Desconectamos de Redis después de los tests
	await prisma.$disconnect(); // Desconectamos de Prisma después de los tests
});
