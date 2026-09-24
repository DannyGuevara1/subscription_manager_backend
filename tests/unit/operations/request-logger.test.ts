import assert from 'node:assert/strict';
import { it } from 'node:test';
import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { requestLogger } from '@/shared/middleware/request-logger.js';
import logger from '@/config/logger.js';

it('logs once with request correlation and omits secrets and raw URLs', (t) => {
	const log = t.mock.method(logger, 'info', () => {});
	const res = Object.assign(new EventEmitter(), {
		locals: {} as Record<string, unknown>,
		statusCode: 500,
		writableFinished: true,
		setHeader: () => {},
	});
	const req = {
		method: 'GET',
		route: { path: '/:id' },
		url: '/secret?token=secret',
		headers: { authorization: 'secret', cookie: 'secret' },
		body: { password: 'secret' },
	};
	let nextCalled = false;
	requestLogger(req as unknown as Request, res as unknown as Response, () => {
		nextCalled = true;
	});
	res.emit('finish');
	res.emit('close');
	assert.ok(nextCalled);
	assert.equal(log.mock.callCount(), 1);
	const entry = log.mock.calls[0]!.arguments[0] as unknown as Record<
		string,
		unknown
	>;
	assert.equal(entry.requestId, res.locals.requestId);
	assert.equal(entry.status, 500);
	assert.ok(!JSON.stringify(entry).includes('secret'));
});
