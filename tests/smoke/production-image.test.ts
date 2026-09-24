import assert from 'node:assert/strict';
import { it } from 'node:test';
import { execFileSync } from 'node:child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import {
	GenericContainer,
	Network,
	Wait,
	type StartedTestContainer,
} from 'testcontainers';

it(
	'runs the production image on an alternate PORT with docs, dependencies and graceful shutdown',
	{ timeout: 180000 },
	async () => {
		const network = await new Network().start();
		let pg: StartedTestContainer | undefined,
			redis: StartedTestContainer | undefined,
			app: StartedTestContainer | undefined,
			migration: StartedTestContainer | undefined;
		try {
			const database = await new PostgreSqlContainer('postgres:15-alpine')
				.withNetwork(network)
				.withNetworkAliases('database')
				.start();
			pg = database;
			redis = await new GenericContainer('redis:alpine')
				.withNetwork(network)
				.withNetworkAliases('cache')
				.withExposedPorts(6379)
				.start();
			migration = await new GenericContainer(
				'subscription-manager:migration-test',
			)
				.withNetwork(network)
				.withEnvironment({
					DATABASE_URL: `postgresql://${database.getUsername()}:${database.getPassword()}@database:5432/${database.getDatabase()}`,
				})
				.withWaitStrategy(Wait.forOneShotStartup())
				.start();

			const seed = await database.exec([
				'psql',
				'-U',
				database.getUsername(),
				'-d',
				database.getDatabase(),
				'-v',
				'ON_ERROR_STOP=1',
				'-c',
				`INSERT INTO "Currency" (code,name,symbol,"exchangeRateToUSD","updatedAt") VALUES ('USD','Dollar','$',1,now());`,
			]);
			assert.equal(seed.exitCode, 0, seed.output);
			app = await new GenericContainer('subscription-manager:release-test')
				.withNetwork(network)
				.withExposedPorts(3100)
				.withEnvironment({
					NODE_ENV: 'production',
					PORT: '3100',
					ENABLE_API_DOCS: 'true',
					CORS_ORIGINS: 'https://client.example.test',
					DATABASE_URL: `postgresql://${database.getUsername()}:${database.getPassword()}@database:5432/${database.getDatabase()}?connection_limit=5&pool_timeout=2&connect_timeout=2`,
					REDIS_URL: 'redis://cache:6379',
					APP_ID_OPENEXCHANGERATES: 'unused-in-cached-smoke',
					JWT_ACCESS_SECRET: 'smoke-only-access-key-32-characters',
					JWT_REFRESH_SECRET: 'smoke-only-refresh-key-32-characters',
				})
				.withWaitStrategy(Wait.forHttp('/api/v1/ready', 3100))
				.start();
			const url = `http://${app.getHost()}:${app.getMappedPort(3100)}/api/v1`;
			const health = await fetch(`${url}/health`);
			assert.equal(health.status, 200);
			assert.ok(health.headers.get('x-request-id'));
			const user = {
				name: 'Smoke User',
				email: 'smoke@example.test',
				password: 'test-password',
				primaryCurrencyCode: 'USD',
			};
			const post = (path: string, body: unknown) =>
				fetch(`${url}${path}`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(body),
				});
			assert.equal((await post('/auth/register', user)).status, 201);
			const login = await post('/auth/login', user);
			assert.equal(login.status, 200);
			const cookies = login.headers.getSetCookie();
			assert.ok(cookies.every((c) => /HttpOnly/i.test(c) && /Secure/i.test(c)));
			const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
			const spec = await fetch(`${url}/api-docs/openapi.yaml`, {
				headers: { cookie },
			});
			assert.equal(spec.status, 200);
			assert.match(await spec.text(), /openapi: "3.1.0"/);
			const summary = await fetch(`${url}/dashboard/summary`, {
				headers: { cookie },
			});
			assert.equal(summary.status, 200);
			assert.equal(
				((await summary.json()) as { data: { totalMonthly: string } }).data
					.totalMonthly,
				'0.00',
			);
			const refresh = await fetch(`${url}/auth/refresh-token`, {
				method: 'POST',
				headers: { cookie },
			});
			assert.equal(refresh.status, 200);
			const uid = await app.exec(['id', '-u']);
			assert.notEqual(uid.output.trim(), '0');
			await redis.stop();
			redis = undefined;
			assert.equal((await fetch(`${url}/ready`)).status, 503);
			assert.equal((await fetch(`${url}/health`)).status, 200);
			// Send SIGTERM through Docker and inspect the retained stopped container.
			await app.stop({ remove: false, timeout: 40000 });
			const state = JSON.parse(
				execFileSync(
					'docker',
					['inspect', '--format', '{{json .State}}', app.getId()],
					{ encoding: 'utf8' },
				),
			);
			assert.equal(state.ExitCode, 0);
			execFileSync('docker', ['rm', app.getId()]);
			app = undefined;
		} finally {
			await app?.stop();
			await redis?.stop();
			await migration?.stop();
			await pg?.stop();
			await network.stop();
		}
	},
);
