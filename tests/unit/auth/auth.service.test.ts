import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import AuthService from '@/modules/auth/auth.service.js';
import type { AuthUser } from '@/modules/auth/auth.type.js';
import { AppError } from '@/shared/errors/app.error.js';

const TEST_USER: AuthUser = {
	id: '0197f644-3f67-7f07-9537-6cc9db95fddd',
	email: 'user@example.com',
	name: 'Unit User',
	primaryCurrencyCode: 'USD',
	role: 'USER',
};

const getJwtHeader = (token: string): { alg?: string } => {
	const [headerB64] = token.split('.');

	if (!headerB64) {
		throw new Error('Invalid JWT format: missing header segment');
	}

	return JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
};

const createAuthServiceForTests = () => {
	const getCalls: string[] = [];
	const delCalls: string[] = [];
	const userServiceCalls: string[] = [];
	const storedTokens = new Map<string, string>();

	const redisMock = {
		get: async (key: string) => {
			getCalls.push(key);
			return storedTokens.get(key) ?? null;
		},
		del: async (key: string) => {
			delCalls.push(key);
			storedTokens.delete(key);
			return 1;
		},
		set: async () => 'OK',
	} as any;

	const loginServiceMock = {
		login: async () => TEST_USER,
	} as any;

	const userServiceMock = {
		getUserByIdInternal: async (id: string) => {
			userServiceCalls.push(id);
			return TEST_USER;
		},
	} as any;

	const service = new AuthService(loginServiceMock, redisMock, userServiceMock);

	return {
		service,
		storedTokens,
		getCalls,
		delCalls,
		userServiceCalls,
	};
};

describe('Auth Service', () => {
	let originalAccessSecret: string | undefined;
	let originalRefreshSecret: string | undefined;
	let originalAccessExpiresIn: string | undefined;
	let originalRefreshExpiresIn: string | undefined;

	beforeEach(() => {
		originalAccessSecret = process.env.JWT_ACCESS_SECRET;
		originalRefreshSecret = process.env.JWT_REFRESH_SECRET;
		originalAccessExpiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN;
		originalRefreshExpiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN;

		process.env.JWT_ACCESS_SECRET = 'unit_test_access_secret';
		process.env.JWT_REFRESH_SECRET = 'unit_test_refresh_secret';
		process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '5m';
		process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
	});

	afterEach(() => {
		if (originalAccessSecret === undefined) {
			delete process.env.JWT_ACCESS_SECRET;
		} else {
			process.env.JWT_ACCESS_SECRET = originalAccessSecret;
		}

		if (originalRefreshSecret === undefined) {
			delete process.env.JWT_REFRESH_SECRET;
		} else {
			process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
		}

		if (originalAccessExpiresIn === undefined) {
			delete process.env.JWT_ACCESS_TOKEN_EXPIRES_IN;
		} else {
			process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = originalAccessExpiresIn;
		}

		if (originalRefreshExpiresIn === undefined) {
			delete process.env.JWT_REFRESH_TOKEN_EXPIRES_IN;
		} else {
			process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = originalRefreshExpiresIn;
		}
	});

	it('generateAccessToken usa HS256 y access secret.', () => {
		const { service } = createAuthServiceForTests();

		const token = service.generateAccessToken(TEST_USER);
		const header = getJwtHeader(token);
		const verified = jwt.verify(
			token,
			process.env.JWT_ACCESS_SECRET as string,
			{ algorithms: ['HS256'] },
		) as JwtPayload;

		assert.strictEqual(header.alg, 'HS256');
		assert.strictEqual(verified.sub, TEST_USER.id);
		assert.strictEqual(verified.email, TEST_USER.email);
		assert.strictEqual(verified.name, TEST_USER.name);
		assert.strictEqual(verified.role, TEST_USER.role);
		assert.strictEqual(
			verified.primaryCurrencyCode,
			TEST_USER.primaryCurrencyCode,
		);
	});

	it('generateRefreshToken usa HS256 y refresh secret.', () => {
		const { service } = createAuthServiceForTests();

		const token = service.generateRefreshToken(TEST_USER);
		const header = getJwtHeader(token);
		const verified = jwt.verify(
			token,
			process.env.JWT_REFRESH_SECRET as string,
			{ algorithms: ['HS256'] },
		) as JwtPayload;

		assert.strictEqual(header.alg, 'HS256');
		assert.strictEqual(verified.sub, TEST_USER.id);
		assert.strictEqual(typeof verified.jti, 'string');
		assert.match(
			verified.jti as string,
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
	});

	it('refreshSession con token no almacenado -> unauthorized.', async () => {
		const { service, getCalls, delCalls, userServiceCalls } =
			createAuthServiceForTests();

		const refreshToken = service.generateRefreshToken(TEST_USER);

		await assert.rejects(
			() => service.refreshSession(refreshToken),
			(error: unknown) => {
				assert.ok(error instanceof AppError);
				assert.strictEqual(error.status, 401);
				assert.strictEqual(error.title, 'Unauthorized');
				assert.strictEqual(error.type, '/problems/unauthorized');
				assert.strictEqual(
					error.detail,
					'Refresh token is invalid or has been revoked',
				);
				return true;
			},
		);

		assert.deepStrictEqual(getCalls, [`refreshToken:${TEST_USER.id}`]);
		assert.deepStrictEqual(delCalls, []);
		assert.deepStrictEqual(userServiceCalls, []);
	});

	it('refreshSession con mismatch (reuso) -> revoca y unauthorized.', async () => {
		const { service, storedTokens, getCalls, delCalls, userServiceCalls } =
			createAuthServiceForTests();

		const refreshToken = service.generateRefreshToken(TEST_USER);
		const differentToken = service.generateRefreshToken(TEST_USER);

		storedTokens.set(`refreshToken:${TEST_USER.id}`, differentToken);

		await assert.rejects(
			() => service.refreshSession(refreshToken),
			(error: unknown) => {
				assert.ok(error instanceof AppError);
				assert.strictEqual(error.status, 401);
				assert.strictEqual(error.title, 'Unauthorized');
				assert.strictEqual(error.type, '/problems/unauthorized');
				assert.strictEqual(
					error.detail,
					'Refresh token does not match stored token, Security alert: Token reuse detected',
				);
				return true;
			},
		);

		assert.deepStrictEqual(getCalls, [`refreshToken:${TEST_USER.id}`]);
		assert.deepStrictEqual(delCalls, [`refreshToken:${TEST_USER.id}`]);
		assert.deepStrictEqual(userServiceCalls, []);
	});
});
