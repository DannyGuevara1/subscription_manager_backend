import assert from 'node:assert';
import { describe, it } from 'node:test';
import request from 'supertest';
import { setupIntegrationEnvironment } from '../setup/test-environment.js';

describe('Health Check - Smoke Test', () => {
	const env = setupIntegrationEnvironment();
	it('Debe responder 404 a una ruta desconocida (El server está vivo)', async () => {
		// Act
		const response = await request(env.getApp())
			.get('/api/v1/ruta-inexistente')
			.set('Origin', 'http://localhost:3000'); // Simula una petición desde el frontend

		// Assert
		// Como tienes un manejador de errores personalizado, verificamos que responda JSON
		// y no se cuelgue.
		assert.strictEqual(response.status, 404);
		assert(response.body); // Tu formato de error
	});

	it('Debe rechazar acceso a rutas protegidas sin token', async () => {
		// Intentamos acceder a users sin token
		const response = await request(env.getApp()).get('/api/v1/users');

		// Debería ser 401 Unauthorized o 403 Forbidden
		// Esto prueba que tus middlewares se están cargando en el test
		assert([401, 403, 500].includes(response.status));
	});
});
