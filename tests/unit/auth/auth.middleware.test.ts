import assert from 'node:assert';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '@/modules/auth/auth.middleware.js';
import { AppError } from '@/shared/errors/app.error.js';
import { unauthorizedError } from '@/shared/errors/error.factory.js';

const runAuthMiddleware = (cookies: Record<string, string>) => {
	let capturedError: unknown;

	const req = {
		cookies,
	} as any; // Cast to any to allow adding custom properties
	const res = {} as any;
	const next = (err?: unknown) => {
		capturedError = err;
	};

	authMiddleware(req, res, next);
	return capturedError;
};

describe('Auth Middleware', () => {
	it('sin ACCESS_TOKEN -> 401 Unauthorized', () => {
		const error = runAuthMiddleware({});
		assert.ok(error instanceof AppError);
		assert.strictEqual(error.status, 401);
		assert.strictEqual(error.title, 'Unauthorized');
		assert.strictEqual(error.type, '/problems/unauthorized');
		assert.strictEqual(error.detail, 'Access token is missing');
	});

	//TODO: ADD TEST CREATE INVALID AND VALID TOKEN USE jwt.
});
