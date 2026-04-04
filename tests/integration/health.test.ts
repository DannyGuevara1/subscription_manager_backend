import assert from 'node:assert';
import { describe, it } from 'node:test';
import request from 'supertest';
import { setupIntegrationEnvironment } from '../setup/test-environment.js';

describe('Health Check - Smoke Test', () => {
	const env = setupIntegrationEnvironment();
	it('Debe responder 200 en /api/v1/health con payload de salud', async () => {
		const response = await request(env.getApp())
			.get('/api/v1/health')
			.set('Origin', 'http://localhost:3000'); // Simula una petición desde el frontend

		assert.strictEqual(response.status, 200);
		assert.strictEqual(response.body.status, 'ok');
		assert.strictEqual(typeof response.body.timestamp, 'string');
		assert.strictEqual(typeof response.body.uptime, 'number');
	});

	it('Debe rechazar acceso a rutas protegidas sin token', async () => {
		const response = await request(env.getApp()).get('/api/v1/users');

		assert.strictEqual(response.status, 401);
	});
});
