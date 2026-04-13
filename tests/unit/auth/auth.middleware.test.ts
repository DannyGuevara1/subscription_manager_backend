import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '@/modules/auth/auth.middleware.js';
import { AppError } from '@/shared/errors/app.error.js';

const runAuthMiddleware = (cookies: Record<string, string>) => {
	let capturedError: unknown;
	let nextCalledWithoutError = false;

	const req = {
		cookies,
	} as any; // Cast to any to allow adding custom properties
	const res = {} as any;
	const next = (err?: unknown) => {
		if (err !== undefined) {
			capturedError = err;
			return;
		}

		nextCalledWithoutError = true;
	};

	authMiddleware(req, res, next);

	return {
		req,
		capturedError,
		nextCalledWithoutError,
	};
};

describe('Auth Middleware', () => {
	let originalAccessSecret: string | undefined;

	beforeEach(() => {
		originalAccessSecret = process.env.JWT_ACCESS_SECRET;
		process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_key_for_unit_tests';
	});

	afterEach(() => {
		if (originalAccessSecret === undefined) {
			delete process.env.JWT_ACCESS_SECRET;
			return;
		}

		process.env.JWT_ACCESS_SECRET = originalAccessSecret;
	});

	it('sin ACCESS_TOKEN -> 401 Unauthorized', () => {
		const { capturedError } = runAuthMiddleware({});
		const error = capturedError;

		assert.ok(error instanceof AppError);
		assert.strictEqual(error.status, 401);
		assert.strictEqual(error.title, 'Unauthorized');
		assert.strictEqual(error.type, '/problems/unauthorized');
		assert.strictEqual(error.detail, 'Access token is missing');
	});

	it('JWT_ACCESS_SECRET faltante -> 500', () => {
		delete process.env.JWT_ACCESS_SECRET;

		const validToken = jwt.sign(
			{
				sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
				email: 'user@example.com',
				name: 'Unit User',
				role: 'USER',
				primaryCurrencyCode: 'USD',
			},
			'test_jwt_access_secret_key_for_unit_tests',
			{ algorithm: 'HS256' },
		);

		const { capturedError } = runAuthMiddleware({
			ACCESS_TOKEN: validToken,
		});
		const error = capturedError;

		assert.ok(error instanceof AppError);
		assert.strictEqual(error.status, 500);
		assert.strictEqual(error.title, 'Internal Server Error');
		assert.strictEqual(error.type, '/problems/internal-server-error');
		assert.strictEqual(error.detail, 'JWT secret key is not configured');
	});

	it('token firmado pero payload invalido -> 401', () => {
		const invalidPayloadToken = jwt.sign(
			{
				sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
				email: 'user@example.com',
				name: 'Unit User',
				primaryCurrencyCode: 'USD',
				// role omitido a propósito
			},
			process.env.JWT_ACCESS_SECRET as string,
			{ algorithm: 'HS256' },
		);

		const { capturedError } = runAuthMiddleware({
			ACCESS_TOKEN: invalidPayloadToken,
		});
		const error = capturedError;

		assert.ok(error instanceof AppError);
		assert.strictEqual(error.status, 401);
		assert.strictEqual(error.title, 'Unauthorized');
		assert.strictEqual(error.type, '/problems/unauthorized');
		assert.strictEqual(error.detail, 'Invalid access token');
	});

	it('token valido y payload valido -> req.user asignado y next sin error', () => {
		const payload = {
			sub: '0197f644-3f67-7f07-9537-6cc9db95fddd',
			email: 'user@example.com',
			name: 'Unit User',
			role: 'USER' as const,
			primaryCurrencyCode: 'USD',
		};

		const validToken = jwt.sign(
			payload,
			process.env.JWT_ACCESS_SECRET as string,
			{
				algorithm: 'HS256',
			},
		);

		const { req, capturedError, nextCalledWithoutError } = runAuthMiddleware({
			ACCESS_TOKEN: validToken,
		});

		assert.strictEqual(capturedError, undefined);
		assert.strictEqual(nextCalledWithoutError, true);
		assert.ok(req.user);
		assert.strictEqual(req.user.sub, payload.sub);
		assert.strictEqual(req.user.email, payload.email);
		assert.strictEqual(req.user.name, payload.name);
		assert.strictEqual(req.user.role, payload.role);
		assert.strictEqual(
			req.user.primaryCurrencyCode,
			payload.primaryCurrencyCode,
		);
		assert.strictEqual(typeof req.user.iat, 'number');
	});
});
