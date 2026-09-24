import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readinessHandler } from '@/shared/health/readiness.js';
import type { Request, Response, NextFunction } from 'express';

async function probe(checks: (() => Promise<unknown>)[]) {
	let status: number | undefined;
	let body: unknown;
	const res = {
		status(n: number) {
			status = n;
			return this;
		},
		type() {
			return this;
		},
		json(value: unknown) {
			body = value;
		},
	};
	await readinessHandler(checks, 5)(
		{} as Request,
		res as unknown as Response,
		(() => {}) as NextFunction,
	);
	return { status, body };
}
it('readiness verifies dependencies and hides failure details', async () => {
	assert.equal((await probe([async () => 1, async () => 'PONG'])).status, 200);
	const result = await probe([
		async () => {
			throw new Error('secret database url');
		},
	]);
	assert.equal(result.status, 503);
	assert.ok(!JSON.stringify(result.body).includes('secret'));
});
it('readiness cannot hang on an unresponsive dependency', async () => {
	assert.equal((await probe([() => new Promise(() => {})])).status, 503);
});
