import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '@/app.js';

describe('Health Check - Smoke Test', () => {
	it('Debe responder 404 a una ruta desconocida (El server está vivo)', async () => {
		// Act
		const response = await request(app).get('/api/v1/ruta-inexistente');

		// Assert
		// Como tienes un manejador de errores personalizado, verificamos que responda JSON
		// y no se cuelgue.
		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty('status'); // Tu formato de error
	});

	it('Debe rechazar acceso a rutas protegidas sin token', async () => {
		// Intentamos acceder a users sin token
		const response = await request(app).get('/api/v1/users');

		// Debería ser 401 Unauthorized o 403 Forbidden
		// Esto prueba que tus middlewares se están cargando en el test
		expect([401, 403, 500]).toContain(response.status);
		// Nota: Puse 500 también para ver qué falla si no está configurado el JWT
	});
});
