import app from '@/app.js';
import 'dotenv/config';
import prisma from '@/config/prisma.js';
import redisClient from '@/config/redis.js';
import { containerPromise } from '@/shared/container/container.js';
import { startCurrencyUpdaterJob } from '@/shared/jobs/currency-updater.job.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
	const container = await containerPromise;
	await redisClient.connect();

	// En tests no queremos timers activos que mantengan el proceso vivo
	const currencyJob =
		process.env.NODE_ENV !== 'test'
			? startCurrencyUpdaterJob(container.cradle.exchangeRateService)
			: null;

	const server = app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});

	const shutdown = async (signal: string) => {
		console.log(`\n${signal} signal received. Starting graceful shutdown...`);

		// Stop accepting new connections
		server.close(async () => {
			try {
				// Stop scheduled jobs
				currencyJob?.stop();

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
