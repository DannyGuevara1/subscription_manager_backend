import { createClient } from 'redis';

const redisClient = createClient({
	socket: {
		host: process.env.REDIS_HOST || 'localhost',
		port: Number(process.env.REDIS_PORT) || 6379,
	},
});

export default redisClient;
