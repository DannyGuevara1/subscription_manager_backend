import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { loginAsUser } from '../../setup/auth-helper.js';
import { setupIntegrationEnvironment } from '../../setup/test-environment.js';

describe('API Docs - Swagger UI', () => {
	const env = setupIntegrationEnvironment();
	let cookie: string;

	before(async () => {
		const credentials = await loginAsUser(env.getApp(), {
			email: 'docsuser@test.com',
			password: 'password123',
			name: 'Docs Test User',
			primaryCurrencyCode: 'USD',
		});
		cookie = credentials.cookie;
	});

	it('Debería servir la UI de Swagger en /api/v1/api-docs/', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/api-docs/')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /html/);

		assert.ok(
			res.text.includes('swagger-ui'),
			'La respuesta debe contener el contenedor de Swagger UI',
		);
		assert.ok(
			res.text.includes('swagger-ui-bundle.js'),
			'La respuesta debe cargar el bundle de Swagger UI',
		);
	});

	it('Debería servir el spec OpenAPI en /api/v1/api-docs/openapi.yaml', async () => {
		const res = await request(env.getApp())
			.get('/api/v1/api-docs/openapi.yaml')
			.set('Origin', 'http://localhost:3000')
			.set('Cookie', cookie)
			.expect(200)
			.expect('Content-Type', /yaml/);

		assert.ok(
			res.text.includes('openapi:'),
			'El spec debe declarar la versión de OpenAPI',
		);
		assert.ok(
			res.text.includes('Subscription Manager API'),
			'El spec debe contener el título de la API',
		);
	});

	it('Debería rechazar acceso a /api/v1/api-docs sin token', async () => {
		await request(env.getApp())
			.get('/api/v1/api-docs/')
			.set('Origin', 'http://localhost:3000')
			.expect(401);
	});

	// Validate method + path against instantiated module routers, not a second hand-written list.
	describe('OpenAPI route contract', () => {
		it('validates OpenAPI 3.1 and documents every application operation', async () => {
			const { readFile } = await import('node:fs/promises');
			const { parse } = await import('yaml');
			const { default: SwaggerParser } = await import(
				'@apidevtools/swagger-parser'
			);
			const spec = parse(await readFile('docs/openapi.yaml', 'utf8'));
			await SwaggerParser.validate(spec);
			const { containerPromise } = await import(
				'@/shared/container/container.js'
			);
			const container = await containerPromise;
			const { default: v1 } = await import('@/routes/index.js');
			type RouteLayer = {
				route?: { path: string; methods: Record<string, boolean> };
			};
			const actual = new Set<string>();
			const addRoutes = (stack: RouteLayer[], prefix: string) => {
				for (const layer of stack) {
					if (!layer.route) continue;
					const path = (prefix + layer.route.path)
						.replace(/\/$/, '')
						.replace(/:([\w]+)/g, '{$1}');
					for (const method of Object.keys(layer.route.methods))
						actual.add(`${method} ${path}`);
				}
			};
			addRoutes(v1.stack as unknown as RouteLayer[], '');
			const prefixes = [
				...new Set(
					Object.keys(spec.paths).map((path) => '/' + path.split('/')[1]),
				),
			];
			for (const key of Object.keys(container.registrations)) {
				if (!key.endsWith('Routes')) continue;
				const router = container.resolve<{ stack: RouteLayer[] }>(key);
				const mount = (
					v1.stack as unknown as {
						handle: unknown;
						match: (path: string) => boolean;
					}[]
				).find((layer) => layer.handle === router);
				assert.ok(mount, `${key} must be mounted`);
				const prefix = prefixes.find((path) => mount.match(path));
				assert.ok(prefix, `${key} mount must exist in the contract`);
				addRoutes(router.stack, prefix);
			}
			const documented = new Set<string>();
			for (const [path, item] of Object.entries(spec.paths)) {
				for (const method of Object.keys(item as object))
					if (
						[
							'get',
							'post',
							'put',
							'patch',
							'delete',
							'head',
							'options',
						].includes(method)
					)
						documented.add(`${method} ${path}`);
			}
			assert.deepStrictEqual([...actual].sort(), [...documented].sort());
			await request(env.getApp()).get('/api/v1/ready').expect(200);
		});
	});
});
