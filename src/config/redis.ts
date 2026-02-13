// src/config/redis.ts
import { createClient } from 'redis';

const redisClient = createClient({
	url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// En lugar de solo exportar el cliente, podrías exportar una función de inicialización
export const connectRedis = async () => {
	if (!redisClient.isOpen) {
		await redisClient.connect();
	}
};

export default redisClient;
