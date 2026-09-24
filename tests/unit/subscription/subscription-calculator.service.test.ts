import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import SubscriptionCalculatorService from '@/modules/subscription/subscription-calculator.service.js';
import type {
	CalculatorConfig,
	ProjectionConfig,
} from '@/modules/subscription/subscription.type.js';

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
		const result = service.nextPaymentDate(config);
		console.log(result);
		assert.strictEqual(result.toISOString(), '2024-03-27T00:00:00.000Z');
	});

	it('proyecta las próximas fechas de pago correctamente (projectNextPaymentDates)', () => {
		const config: ProjectionConfig = {
			billingFrequency: 1,
			billingUnit: 'MONTHS',
			firstPaymentDate: new Date('2024-03-02T00:00:00Z'),
			endDate: new Date('2024-05-31T00:00:00Z'),
		};
		const result = service.projectNextPaymentDates(config);

		assert.deepStrictEqual(result, [
			new Date('2024-03-02T00:00:00Z'),
			new Date('2024-04-02T00:00:00Z'),
			new Date('2024-05-02T00:00:00Z'),
		]);
	});
});

it('keeps a trial longer than one interval monotonic and starts billing at trial end', () => {
	const service = new SubscriptionCalculatorService();
	assert.deepStrictEqual(
		service
			.projectNextPaymentDates({
				firstPaymentDate: new Date('2026-01-01T00:00:00Z'),
				trialEndsOn: new Date('2026-03-10T00:00:00Z'),
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				endDate: new Date('2026-05-10T00:00:00Z'),
			})
			.map((d) => d.toISOString()),
		[
			'2026-03-10T00:00:00.000Z',
			'2026-04-10T00:00:00.000Z',
			'2026-05-10T00:00:00.000Z',
		],
	);
	assert.strictEqual(
		service
			.nextPaymentDate({
				firstPaymentDate: new Date('2026-01-01T00:00:00Z'),
				trialEndsOn: new Date('2026-03-10T00:00:00Z'),
				referenceDate: new Date('2026-03-11T00:00:00Z'),
				billingFrequency: 1,
				billingUnit: 'MONTHS',
			})
			.toISOString(),
		'2026-04-10T00:00:00.000Z',
	);
});
it('preserves end-of-month and leap-year anchors without cumulative drift', () => {
	const service = new SubscriptionCalculatorService();
	assert.deepStrictEqual(
		service
			.projectNextPaymentDates({
				firstPaymentDate: new Date('2024-01-31T00:00:00Z'),
				billingFrequency: 1,
				billingUnit: 'MONTHS',
				endDate: new Date('2024-03-31T00:00:00Z'),
			})
			.map((d) => d.toISOString()),
		[
			'2024-01-31T00:00:00.000Z',
			'2024-02-29T00:00:00.000Z',
			'2024-03-31T00:00:00.000Z',
		],
	);
});
it('ignores a trial before the anchor and handles the default reference date', () => {
	const service = new SubscriptionCalculatorService();
	const future = new Date('2099-01-01T00:00:00Z');
	assert.deepStrictEqual(
		service.nextPaymentDate({
			firstPaymentDate: future,
			trialEndsOn: new Date('2098-01-01'),
			billingFrequency: 1,
			billingUnit: 'YEARS',
		}),
		future,
	);
	assert.deepStrictEqual(
		service.projectNextPaymentDates({
			firstPaymentDate: future,
			billingFrequency: 1,
			billingUnit: 'DAYS',
			endDate: new Date('2098-01-01'),
		}),
		[],
	);
});
it('reports invalid calendar dates rather than returning corrupt projections', () => {
	assert.throws(
		() =>
			new SubscriptionCalculatorService().nextPaymentDate({
				firstPaymentDate: new Date(NaN),
				billingFrequency: 1,
				billingUnit: 'MONTHS',
			}),
		/Error al calcular/,
	);
});
