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
            billingFrequency: 1,
            billingUnit: 'MONTHS',
            firstPaymentDate: new Date('2024-01-31T00:00:00Z'),
            referenceDate: new Date('2024-02-15T00:00:00Z'),
        };
        const result = service.nextPaymentDate(config)
        assert.strictEqual(result.toISOString(), '2024-02-29T00:00:00.000Z')
    });

});
