import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AppError } from '@/shared/errors/app.error.js';

describe('AppError', () => {
	it('no sobreescribe campos RFC con extensions reservadas', () => {
		const error = new AppError({
			type: '/problems/resource-not-found',
			title: 'Resource Not Found',
			status: 404,
			detail: 'Original detail',
			instance: '/subscriptions/123',
			extensions: {
				type: '/problems/hacked',
				title: 'Hacked title',
				status: 418,
				detail: 'Overwritten detail',
				instance: '/evil',
				traceId: 'trace-123',
			},
		});

		const problem = error.toProblemDetails();

		// Campos RFC deben mantener su valor original
		assert.strictEqual(problem.type, '/problems/resource-not-found');
		assert.strictEqual(problem.title, 'Resource Not Found');
		assert.strictEqual(problem.status, 404);
		assert.strictEqual(problem.detail, 'Original detail');
		assert.strictEqual(problem.instance, '/subscriptions/123');

		// Campos no reservados sí se permiten como extensions
		assert.strictEqual(problem.traceId, 'trace-123');
	});

	it('omite extensions en toProblemDetails si vacio.', () => {
		const error = new AppError({
			type: '/problems/some-error',
			title: 'Some Error',
			status: 400,
			detail: 'An error occurred',
			instance: '/test/instance',
			extensions: {}, // Extensions vacías
		});

		const problem = error.toProblemDetails();
		assert.strictEqual(problem.extensions, undefined);
	});

	it('omite extensions en log si vacio.', () => {
		const error = new AppError({
			type: '/problems/some-error',
			title: 'Some Error',
			status: 400,
			detail: 'An error occurred',
			instance: '/test/instance',
			extensions: {}, // Extensions vacías
		});

		const problem = error.toLogFormat();
		assert.strictEqual(problem.extensions, undefined);
	});
});
