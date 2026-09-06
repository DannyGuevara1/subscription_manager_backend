import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getBillingAnchor } from '@/modules/subscription/subscription-billing-anchor.js';

// Datos base: una suscripción cualquiera. En cada test solo sobreescribimos
// lo que nos interesa con el spread.
const BASE = {
	firstPaymentDate: new Date('2026-01-01T00:00:00Z'),
	resumedAt: null,
	status: 'ACTIVE' as const,
};

describe('getBillingAnchor', () => {
	it('devuelve firstPaymentDate cuando la suscripción nunca fue reanudada', () => {
		const result = getBillingAnchor(BASE);

		assert.deepStrictEqual(result, BASE.firstPaymentDate);
	});

	it('debe devolver resumedAt cuando la suscripción fue reanudada', () => {
		const result = getBillingAnchor({
			...BASE,
			resumedAt: new Date('2026-01-02T00:00:00Z'),
		});

		assert.deepStrictEqual(result, new Date('2026-01-02T00:00:00Z'));
	});

	it('debe devolver firstPaymentDate cuando la suscripcion esta pausada y tiene resumedAt', () => {
		const result = getBillingAnchor({
			...BASE,
			status: 'PAUSED',
			resumedAt: new Date('2026-01-02T00:00:00Z'),
		});

		assert.deepStrictEqual(result, BASE.firstPaymentDate);
	});
});
