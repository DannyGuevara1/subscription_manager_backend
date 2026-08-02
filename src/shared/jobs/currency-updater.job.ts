import cron, { type ScheduledTask } from 'node-cron';
import logger from '@/config/logger.js';
import type ExchangeRateService from '@/modules/currency/exchange-rate.service.js';

/**
 * Job diario (00:00 UTC) que refresca proactivamente las tasas de cambio.
 * El patrón SWR de ExchangeRateService queda como fallback si el job falla.
 */
export function startCurrencyUpdaterJob(
	exchangeRateService: ExchangeRateService,
): ScheduledTask {
	const task = cron.schedule('0 0 * * *', async () => {
		logger.info('Currency updater job started');
		const updated = await exchangeRateService.updateAllRates();
		logger.info({ updated }, 'Currency updater job finished');
	});

	logger.info('Currency updater job scheduled (daily at 00:00)');
	return task;
}
