import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedTestContainer;

export async function startContainers() {
	console.log('🚀 Iniciando contenedores de prueba...');

	// PostgreSQL
	postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
		.withExposedPorts(5432)
		.withDatabase('test_db')
		.withUsername('test_user')
		.withPassword('test_password')
		.start();

	// Redis
	redisContainer = await new GenericContainer('redis:alpine')
		.withExposedPorts(6379)
		.start();

	// Configurar variables de entorno para Prisma y Redis
	const databaseUrl = `postgresql://test_user:test_password@${postgresContainer.getHost()}:${postgresContainer.getPort()}/test_db`;

	process.env.DATABASE_URL = databaseUrl;
	process.env.REDIS_HOST = redisContainer.getHost();
	process.env.REDIS_PORT = redisContainer.getMappedPort(6379).toString();
	process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

	console.log('✅ Contenedores iniciados');
	console.log(`📊 PostgreSQL: ${databaseUrl}`);
	console.log(`🔴 Redis: ${process.env.REDIS_URL}`);

	return { postgresContainer, redisContainer };
}

export async function stopContainers() {
	console.log('🛑 Deteniendo contenedores...');

	if (postgresContainer) {
		await postgresContainer.stop();
	}

	if (redisContainer) {
		await redisContainer.stop();
	}

	console.log('✅ Contenedores detenidos');
}

export function getContainers() {
	return { postgresContainer, redisContainer };
}
