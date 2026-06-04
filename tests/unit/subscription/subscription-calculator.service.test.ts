import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type { CalculatorConfig, ProjectionConfig } from '@/modules/subscription/subscription.type.js'

describe('SubscriptionCalculatorService', () => {
    let service: SubscriptionCalculatorService;

    beforeEach(() => {
        service = new SubscriptionCalculatorService();
    });

    it('calcula la fecha del próximo pago correctamente (nextPaymentDate)', () => {
        const config: CalculatorConfig = {
            billingFrequency: 2,
            billingUnit: 'MONTHS',
            firstPaymentDate: new Date('2024-01-27T00:00:00Z'),
            referenceDate: new Date('2024-02-21T00:00:00Z'),
        };
        const result = service.nextPaymentDate(config)
        console.log(result)
        assert.strictEqual(result.toISOString(), '2024-03-27T00:00:00.000Z')
    });

    it('proyecta las próximas fechas de pago correctamente (projectNextPaymentDates)', () => {
        const config: ProjectionConfig = {
            billingFrequency: 1,
            billingUnit: 'MONTHS',
            firstPaymentDate: new Date('2024-03-02T00:00:00Z'),
            endDate: new Date('2024-05-31T00:00:00Z'),
        };
        const result = service.projectNextPaymentDates(config)

        assert.deepStrictEqual(result, [
            new Date('2024-03-02T00:00:00Z'),
            new Date('2024-04-02T00:00:00Z'),
            new Date('2024-05-02T00:00:00Z'),
        ])
    });

});
