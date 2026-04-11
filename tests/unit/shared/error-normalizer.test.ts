import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '@/shared/errors/app.error.js';
import { errorNormalizer } from '@/shared/middleware/error.normalizer.js';

const runNormalizer = (err: unknown, originalUrl = '/test/path') => {
	let capturedError: unknown;

	const req = {
		method: 'GET',
		originalUrl,
	} as Request;
	const res = {} as Response;

	errorNormalizer(err, req, res, (nextErr?: unknown) => {
		capturedError = nextErr;
	});

	return capturedError;
};

describe('Error Normalizer Middleware', () => {
	it('zod error -> validation error 422.', () => {
		const schema = z.object({ id: z.number().int() });
		const parsed = schema.safeParse({ id: 'abc' });

		assert.strictEqual(parsed.success, false);

		const normalizedError = runNormalizer(parsed.error, '/validation-test');

		assert.ok(normalizedError instanceof AppError);
		assert.strictEqual(normalizedError.status, 422);
		assert.strictEqual(normalizedError.type, '/problems/validation-error');
		assert.strictEqual(normalizedError.instance, '/validation-test');
		assert.ok(normalizedError.extensions);
		assert.deepStrictEqual(normalizedError.extensions.validationErrors, [
			{
				field: 'id',
				message: 'Invalid input: expected number, received string',
			},
		]);
	});

	it('non-Error throw -> internal 500 con fallback.', () => {
		const normalizedError = runNormalizer(
			'This is a string error',
			'/string-error',
		);
		assert.ok(normalizedError instanceof AppError);
		assert.strictEqual(normalizedError.status, 500);
		assert.strictEqual(normalizedError.type, '/problems/internal-server-error');
		assert.strictEqual(normalizedError.title, 'Internal Server Error');
		assert.strictEqual(normalizedError.instance, '/string-error');
		assert.strictEqual(
			normalizedError.detail,
			'Non-Error value thrown: This is a string error',
		);
	});
});
