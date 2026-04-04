import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../../src/shared/middleware/validate.request.js';

type MutableRequest = Pick<Request, 'body' | 'query' | 'params'>;

const runValidation = async (
	schema: z.ZodType<{
		body?: unknown;
		query?: unknown;
		params?: unknown;
	}>,
	reqData: Partial<MutableRequest>,
) => {
	const middleware = validateRequest(schema);
	const req = {
		body: {},
		query: {},
		params: {},
		...reqData,
	} as Request;
	const res = {} as Response;
	let capturedError: unknown;

	await middleware(req, res, (error?: unknown) => {
		capturedError = error;
	});

	return { req, capturedError };
};

describe('Middleware validateRequest', () => {
	it('debe validar y transformar params y query cuando ambos están en el schema', async () => {
		const schema = z.object({
			params: z.object({
				id: z.coerce.number().int().positive(),
			}),
			query: z.object({
				page: z.coerce.number().int().positive(),
				isActive: z
					.enum(['true', 'false'])
					.transform((value) => value === 'true'),
			}),
		});

		const { req, capturedError } = await runValidation(schema, {
			params: { id: '42' },
			query: { page: '2', isActive: 'true' },
		});

		assert.strictEqual(capturedError, undefined);
		const validatedParams = req.validated.params as { id: number };
		const validatedQuery = req.validated.query as {
			page: number;
			isActive: boolean;
		};

		assert.strictEqual(typeof validatedParams.id, 'number');
		assert.strictEqual(validatedParams.id, 42);
		assert.strictEqual(typeof validatedQuery.page, 'number');
		assert.strictEqual(validatedQuery.page, 2);
		assert.strictEqual(typeof validatedQuery.isActive, 'boolean');
		assert.strictEqual(validatedQuery.isActive, true);
	});

	it('debe enviar error a next cuando query no cumple el schema', async () => {
		const schema = z.object({
			query: z.object({
				page: z.coerce.number().int().positive(),
			}),
		});

		const { capturedError } = await runValidation(schema, {
			query: { page: 'abc' },
		});

		assert.ok(capturedError);
		assert.equal((capturedError as Error).name, 'ZodError');
	});

	it('si el schema no define query, query no se transforma y queda como string', async () => {
		const schema = z.object({
			params: z.object({ id: z.string() }),
		});

		const { req, capturedError } = await runValidation(schema, {
			params: { id: 'user-1' },
			query: { page: '3' },
		});

		assert.strictEqual(capturedError, undefined);
		const rawQuery = req.query as { page: string };
		assert.strictEqual(typeof rawQuery.page, 'string');
		assert.strictEqual(rawQuery.page, '3');
	});
});
