import 'dotenv/config';
import app from '@/app.js';
import prisma from '@/config/prisma.js';
import redisClient from '@/config/redis.js';
import logger from '@/config/logger.js';
import { containerPromise } from '@/shared/container/container.js';
import { startCurrencyUpdaterJob } from '@/shared/jobs/currency-updater.job.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
	const container = await containerPromise;
	await redisClient.connect();
	const currencyJob =
		process.env.NODE_ENV !== 'test'
			? startCurrencyUpdaterJob(container.cradle.exchangeRateService)
			: null;
	const server = app.listen(PORT, () =>
		logger.info({ port: PORT }, 'Server listening'),
	);
	let shuttingDown = false;
	const shutdown = (signal: string) => {
		if (shuttingDown) return;
		shuttingDown = true;
		logger.info({ signal }, 'Graceful shutdown started');
		const deadline = setTimeout(() => process.exit(1), 30000);
		deadline.unref();
		server.close(async () => {
			try {
				await currencyJob?.stop();
				// After HTTP drains there is no work to queue; also stop reconnecting on outage.
				if (redisClient.isOpen) redisClient.destroy();
				await prisma.$disconnect();
				clearTimeout(deadline);
				logger.info('Graceful shutdown completed');
				process.exit(0);
			} catch {
				logger.error('Graceful shutdown failed');
				process.exit(1);
			}
		});
	};
	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(() => {
	logger.error('Server startup failed; verify dependency configuration');
	process.exit(1);
});
