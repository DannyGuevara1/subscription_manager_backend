import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';
import { Temporal } from 'temporal-polyfill';
import logger from '@/config/logger.js';
import { notFoundError } from '@/shared/errors/error.factory.js';

export default class ExchangeRateService {
	private exchangeRateProvider: ExchangeRateProvider;
	private currencyRepository: CurrencyRepository;
	constructor(
		exchangeRateProvider: ExchangeRateProvider,
		currencyRepository: CurrencyRepository,
	) {
		this.exchangeRateProvider = exchangeRateProvider;
		this.currencyRepository = currencyRepository;
	}

	private toTemporal(d: Date) {
		return Temporal.Instant.fromEpochMilliseconds(
			d.getTime(),
		).toZonedDateTimeISO('UTC');
	}

	async getRateToUSD(currencyCode: string): Promise<number> {
		if (currencyCode === 'USD') return 1;

		const currency = await this.currencyRepository.findByCode(currencyCode);
		if (!currency) {
			throw notFoundError({
				resource: 'Currency',
				identifier: currencyCode,
				extensions: {
					detail: `No currency found with code ${currencyCode}.`,
				},
			});
		}

		const hourSave = this.toTemporal(currency.rateUpdatedAt);
		const hourAgo = Temporal.Now.instant().toZonedDateTimeISO('UTC');

		const isStale = hourSave.until(hourAgo, { largestUnit: 'hours' });

		if (isStale.hours > 24) {
			this.updateRateInBackground(currencyCode).catch((err) => {
				logger.error(
					{ err, currencyCode },
					'Background exchange rate update failed',
				);
			});
		}

		return currency.exchangeRateToUSD ?? 1;
	}

	/**
	 * Actualiza las tasas de TODAS las monedas en una sola llamada al provider.
	 * Devuelve cuántas monedas se actualizaron. No lanza errores: un fallo del
	 * job no debe tumbar el servidor; el SWR sigue sirviendo las tasas viejas.
	 */
	async updateAllRates(): Promise<number> {
		try {
			const rates = await this.exchangeRateProvider.getAllRates();
			const currencies = await this.currencyRepository.findAll();
			const now = new Date();

			let updated = 0;
			for (const currency of currencies) {
				const rate = rates[currency.code];
				if (rate == null) continue;
				await this.currencyRepository.update(currency.code, {
					exchangeRateToUSD: rate,
					rateUpdatedAt: now,
				});
				updated++;
			}
			return updated;
		} catch (err) {
			logger.error({ err }, 'Failed to update all exchange rates');
			return 0;
		}
	}

	private async updateRateInBackground(currencyCode: string) {
		try {
			const newRate = await this.exchangeRateProvider.getRate(
				currencyCode,
				'USD',
			);

			await this.currencyRepository.update(currencyCode, {
				exchangeRateToUSD: newRate,
				rateUpdatedAt: new Date(),
			});
		} catch (err) {
			logger.error({ err, currencyCode }, 'Failed to update exchange rate');
		}
	}
}
