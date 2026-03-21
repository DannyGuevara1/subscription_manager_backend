import { execSync } from 'node:child_process';
import { after, before } from 'node:test';
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

export function setupIntegrationEnvironment() {
	let postgresContainer: StartedPostgreSqlContainer;
	let redisContainer: StartedTestContainer;
	let app: any;
	let appRedisClient: any;
	let prismaClient: any;

	before(
		async () => {
			console.log('🚀 Iniciando contenedores de prueba...');

			try {
				postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
					.withDatabase('test_db')
					.withUsername('test_user')
					.withPassword('test_password')
					.start();

				console.log('✅ PostgreSQL iniciado');

				redisContainer = await new GenericContainer('redis:alpine')
					.withExposedPorts(6379)
					.start();

				console.log('✅ Redis iniciado');

				process.env.DATABASE_URL = postgresContainer.getConnectionUri();
				process.env.REDIS_HOST = redisContainer.getHost();
				process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();
				process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

				// Variables de JWT (¡IMPORTANTE!)
				process.env.JWT_ACCESS_SECRET =
					'test_jwt_access_secret_key_for_testing_only';
				process.env.JWT_REFRESH_SECRET =
					'test_jwt_refresh_secret_key_for_testing_only';
				process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '5m';
				process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
				process.env.SESSION_SECRET = 'test_session_secret_key_for_testing_only';

				// Otras variables que tu app pueda necesitar
				process.env.NODE_ENV = 'test';
				process.env.CORS_ORIGINS = 'http://localhost:3000';

				console.log('📊 DATABASE_URL:', process.env.DATABASE_URL);
				console.log('🔴 REDIS_URL:', process.env.REDIS_URL);
				console.log(
					'🔑 JWT_SECRET:',
					process.env.JWT_ACCESS_SECRET ? '✓ configurado' : '✗ falta',
				);

				const prismaModule = await import('@/config/prisma.js');
				prismaClient = prismaModule.default;

				const { default: redisClient } = await import('@/config/redis.js');
				appRedisClient = redisClient;
				if (!redisClient.isOpen) {
					await redisClient.connect();
				}

				console.log('✅ Redis de la App conectado');

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

				const appModule = await import('@/app.js');
				app = appModule.default;

				console.log('✅ Setup completo');
			} catch (error) {
				console.error('❌ Error en setup:', error);
				throw error;
			}
		},
		{ timeout: 120000 },
	);

	after(async () => {
		console.log('🧹 [Cleanup] Limpiando entorno...');
		try {
			if (appRedisClient) {
				await appRedisClient.quit();
				console.log('✅ Redis de la App desconectado');
			}

			if (redisContainer) {
				await redisContainer.stop();
				console.log('✅ Contenedor de Redis detenido');
			}

			if (prismaClient) {
				await prismaClient.$disconnect();
				console.log('✅ Prisma Client desconectado');
			}

			if (postgresContainer) {
				await postgresContainer.stop();
				console.log('✅ Contenedor de PostgreSQL detenido');
			}

			console.log('✅ Cleanup completo');
		} catch (error) {
			console.error('❌ Error durante cleanup:', error);
			throw error;
		}
	});

	return {
		getApp: () => app,
		getPrismaClient: () => prismaClient,
		getRedisClient: () => appRedisClient,
	};
}
