import { PrismaClient } from '@prisma/client';
import { createClient, type RedisClientType } from 'redis';

let prismaInstance: PrismaClient;
let redisInstance: RedisClientType;

export function getPrismaClient(): PrismaClient {
	if (!prismaInstance) {
		prismaInstance = new PrismaClient({
			datasources: {
				db: {
					url: process.env.DATABASE_URL,
				},
			},
		});
	}
	return prismaInstance;
}

export function getRedisClient(): RedisClientType {
	if (!redisInstance) {
		redisInstance = createClient({
			socket: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379'),
			},
		});

		// Manejar errores de conexión
		redisInstance.on('error', (err) => {
			console.error('Redis Client Error:', err);
		});
	}
	return redisInstance;
}

export async function cleanDatabase() {
	const prisma = getPrismaClient();

	// Obtener todos los modelos de Prisma
	const modelNames = Object.keys(prisma).filter(
		(key) => !key.startsWith('_') && !key.startsWith('$'),
	);

	// Eliminar todos los registros en orden inverso (por foreign keys)
	for (const modelName of modelNames.reverse()) {
		const model = (prisma as any)[modelName];
		if (model && typeof model.deleteMany === 'function') {
			try {
				await model.deleteMany();
			} catch (error) {
				console.warn(`No se pudo limpiar ${modelName}:`, error);
			}
		}
	}
}

export async function cleanRedis() {
	const redis = getRedisClient();

	// Verificar si está conectado antes de limpiar
	if (!redis.isOpen) {
		await redis.connect();
	}

	await redis.flushDb();
}

export async function closeConnections() {
	if (prismaInstance) {
		await prismaInstance.$disconnect();
		prismaInstance = undefined as any;
	}

	if (redisInstance) {
		if (redisInstance.isOpen) {
			await redisInstance.quit();
		}
		redisInstance = undefined as any;
	}
}

// Seed de datos comunes para tests
export async function seedTestData() {
	const prisma = getPrismaClient();

	// Ejemplo: crear datos base que múltiples tests puedan necesitar
	// await prisma.currency.createMany({
	//   data: [
	//     { code: 'USD', name: 'US Dollar' },
	//     { code: 'EUR', name: 'Euro' }
	//   ],
	//   skipDuplicates: true
	// });
}

// Helper para verificar conexiones
export async function ensureConnections() {
	const prisma = getPrismaClient();
	const redis = getRedisClient();

	// Verificar Prisma
	await prisma.$connect();

	// Verificar Redis
	if (!redis.isOpen) {
		await redis.connect();
	}

	// Ping para asegurar que funciona
	await redis.ping();

	console.log('✅ Conexiones verificadas - Prisma y Redis OK');
}
