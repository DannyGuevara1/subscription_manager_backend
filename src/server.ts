import app from '@/app.js';
import 'dotenv/config';
import prisma from '@/config/prisma.js';
import redisClient from '@/config/redis.js';
import { containerPromise } from '@/shared/container/container.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
	await containerPromise;
	await redisClient.connect();

	const server = app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});

	const shutdown = async (signal: string) => {
		console.log(`\n${signal} signal received. Starting graceful shutdown...`);

		// Stop accepting new connections
		server.close(async () => {
			try {
				// Disconnect Redis
				await redisClient.quit();
				console.log('Redis connection closed');

				// Disconnect Prisma
				await prisma.$disconnect();
				console.log('Prisma connection closed');

				console.log('Graceful shutdown completed');
				process.exit(0);
			} catch (error) {
				console.error('Error during shutdown:', error);
				process.exit(1);
			}
		});

		// Force shutdown if graceful takes too long (30 seconds)
		setTimeout(() => {
			console.error('Graceful shutdown timeout exceeded, forcing exit');
			process.exit(1);
		}, 30000);
	};

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
