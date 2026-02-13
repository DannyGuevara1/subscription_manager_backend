import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { createClient, type RedisClientType } from 'redis';
import request from 'supertest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

describe('Módulo de Autenticación y registro', () => {
	let postgresContainer: StartedPostgreSqlContainer;
	let redisContainer: StartedTestContainer;
	let testRedisClient: RedisClientType;
	let app: any;
	let appRedisClient: any;

	before(
		async () => {
			console.log('🚀 Iniciando contenedores de prueba...');

			try {
				// 1. Iniciar PostgreSQL
				postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
					.withDatabase('test_db')
					.withUsername('test_user')
					.withPassword('test_password')
					.start();

				console.log('✅ PostgreSQL iniciado');

				// 2. Iniciar Redis
				redisContainer = await new GenericContainer('redis:alpine')
					.withExposedPorts(6379)
					.start();

				console.log('✅ Redis iniciado');

				// 3. Configurar TODAS las variables de entorno necesarias
				process.env.DATABASE_URL = postgresContainer.getConnectionUri();
				process.env.REDIS_HOST = redisContainer.getHost();
				process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();
				process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

				// Variables de JWT (¡IMPORTANTE!)
				process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
				process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '5m';
				process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
				process.env.SESSION_SECRET = 'test_session_secret_key_for_testing_only';

				// Otras variables que tu app pueda necesitar
				process.env.NODE_ENV = 'test';

				console.log('📊 DATABASE_URL:', process.env.DATABASE_URL);
				console.log('🔴 REDIS_URL:', process.env.REDIS_URL);
				console.log(
					'🔑 JWT_SECRET:',
					process.env.JWT_SECRET ? '✓ configurado' : '✗ falta',
				);

				// 4. Crear cliente de Redis para tests
				testRedisClient = createClient({
					url: process.env.REDIS_URL,
				});
				await testRedisClient.connect();

				const { default: redisClient } = await import('@/config/redis.js');
				appRedisClient = redisClient;
				if (!redisClient.isOpen) {
					await redisClient.connect();
				}

				console.log('✅ Redis de la App conectado');

				// 5. Sincronizar schema
				const { execSync } = await import('node:child_process');

				console.log('🔄 Sincronizando schema de base de datos...');
				execSync('npx prisma db push --force-reset --skip-generate', {
					stdio: 'inherit',
					env: process.env,
				});

				// 6. Ejecutar seed
				console.log('🌱 Ejecutando seed...');
				execSync('npx prisma db seed', {
					stdio: 'inherit',
					env: process.env,
				});

				console.log('✅ Schema sincronizado');

				// 7. AHORA sí importar la app
				const appModule = await import('@/app.js');
				app = appModule.default;

				console.log('✅ App cargada');

				// Esperar un poco para asegurar que todo esté listo
				await new Promise((resolve) => setTimeout(resolve, 1000));

				console.log('✅ Setup completo');
			} catch (error) {
				console.error('❌ Error en setup:', error);
				throw error;
			}
		},
		{ timeout: 120000 },
	);

	const mockUser = {
		email: 'test@example.com',
		password: 'password123',
		name: 'Test User',
		primaryCurrencyCode: 'USD',
	};

	it(
		'Debe registrar un nuevo usuario',
		async () => {
			const response = await request(app)
				.post('/api/v1/auth/register')
				.set('Origin', 'http://localhost:3000')
				.send(mockUser);

			//console.log('Register response:', response.status, response.body);
			assert.strictEqual(response.status, 201);
			assert(response.body.data);
		},
		{ timeout: 10000 },
	);

	it(
		'Debe iniciar sesión con un usuario registrado',
		async () => {
			const response = await request(app)
				.post('/api/v1/auth/login')
				.set('Origin', 'http://localhost:3000')
				.send({
					email: mockUser.email,
					password: mockUser.password,
				});

			//console.log('Login response:', response.status, response.body);
			assert.strictEqual(response.status, 200);
			assert(response.body.data);
		},
		{ timeout: 10000 },
	);

	after(async () => {
		console.log('🧹 Limpiando...');

		try {
			if (testRedisClient.isOpen) {
				await testRedisClient.quit();
			}

			if (appRedisClient.isOpen) {
				await appRedisClient.quit();
			}

			if (redisContainer) {
				await redisContainer.stop();
			}

			if (postgresContainer) {
				await postgresContainer.stop();
			}

			console.log('✅ Limpieza completa');
		} catch (error) {
			console.error('❌ Error en cleanup:', error);
		}
	});
});
