import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../src/shared/errors/app.error.js';
import { forbiddenError } from '../../../src/shared/errors/error.factory.js';
import { errorNormalizer } from '../../../src/shared/middleware/error.normalizer.js';

type NextCapture = {
	error?: unknown;
};

const runNormalizer = (err: unknown, originalUrl = '/test/path') => {
	const capture: NextCapture = {};
	const req = {
		method: 'GET',
		originalUrl,
	} as Request;
	const res = {} as Response;

	errorNormalizer(err, req, res, (nextErr?: unknown) => {
		capture.error = nextErr;
	});

	return capture.error;
};

describe('Middleware errorNormalizer', () => {
	it('debe pasar AppError tal cual y asignar instance si no existe', () => {
		const appErr = forbiddenError({
			detail: 'Forbidden test',
		});

		const captured = runNormalizer(appErr, '/users/123');

		assert.ok(captured instanceof AppError);
		const normalized = captured as AppError;
		assert.strictEqual(normalized.status, 403);
		assert.strictEqual(normalized.instance, '/users/123');
	});

	it('debe mapear ZodError a validation error (422)', () => {
		const schema = z.object({ id: z.number().int() });
		const parsed = schema.safeParse({ id: 'abc' });
		assert.strictEqual(parsed.success, false);

		const captured = runNormalizer(parsed.error, '/validation-test');

		assert.ok(captured instanceof AppError);
		const normalized = captured as AppError;
		assert.strictEqual(normalized.status, 422);
		assert.strictEqual(normalized.type, '/problems/validation-error');
	});

	it('debe convertir throws no-Error en internal error (500)', () => {
		const captured = runNormalizer('boom-string', '/non-error-throw');

		assert.ok(captured instanceof AppError);
		const normalized = captured as AppError;
		assert.strictEqual(normalized.status, 500);
		assert.strictEqual(normalized.type, '/problems/internal-server-error');
		assert.ok(normalized.detail?.includes('Non-Error value thrown'));
	});

	it('debe mapear Error genérico a internal error no operacional', () => {
		const captured = runNormalizer(new Error('Unexpected fail'), '/generic-error');

		assert.ok(captured instanceof AppError);
		const normalized = captured as AppError;
		assert.strictEqual(normalized.status, 500);
		assert.strictEqual(normalized.isOperational, false);
	});
});
