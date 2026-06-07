import { describe, it, mock, beforeEach, type Mock } from 'node:test';
import assert from 'node:assert';
import ExchangeRateService from '@/modules/currency/exchange-rate.service.js';
import type { ExchangeRateProvider } from '@/modules/currency/ports/exchange-rate.provider.js';
import type CurrencyRepository from '@/modules/currency/currency.repository.js';

describe('ExchangeRateService', () => {
    let service: ExchangeRateService;
    let mockProvider: { getRate: Mock<ExchangeRateProvider['getRate']> };
    let mockRepo: any;

    beforeEach(() => {
        mockProvider = {
            getRate: mock.fn(async () => 1000)
        };

        mockRepo = {
            findByCode: mock.fn(),
            update: mock.fn()
        };

        service = new ExchangeRateService(mockProvider as unknown as ExchangeRateProvider, mockRepo as CurrencyRepository)
    });

    it('Deberia retornar 1 directamente si la moneda es USD', async () => {
        const result = await service.getRateToUSD('USD');
        assert.strictEqual(result, 1);
        assert.strictEqual(mockRepo.findByCode.mock.callCount(), 0);
    });

    it('Deberia usar getRate 1 vez cuando rateUpdatedAt sea mayor a 24h ', async () => {
        mockRepo.findByCode.mock.mockImplementation(async () => ({
            code: 'ARG',
            exchangeRateToUSD: 500,
            rateUpdatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }));
        const result = await service.getRateToUSD('ARG');
        assert.strictEqual(result, 500);
        assert.strictEqual(mockProvider.getRate.mock.callCount(), 1)
    });

    it('NO debería llamar al Provider cuando la moneda está fresca (< 24h)', async () => {
        mockRepo.findByCode.mock.mockImplementation(async () => ({
            code: 'EUR',
            exchangeRateToUSD: 0.85,
            rateUpdatedAt: new Date() // ¡Hoy! Acaba de actualizarse
        }));

        const result = await service.getRateToUSD('EUR');

        assert.strictEqual(result, 0.85);

        assert.strictEqual(mockProvider.getRate.mock.callCount(), 0);
    });
})