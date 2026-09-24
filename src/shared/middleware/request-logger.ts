import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import logger from '@/config/logger.js';

export const requestLogger: RequestHandler = (req, res, next) => {
	const requestId = randomUUID();
	const started = performance.now();
	res.locals.requestId = requestId;
	res.setHeader('X-Request-ID', requestId);
	let logged = false;
	const log = () => {
		if (logged) return;
		logged = true;
		// Log route templates, never URL/query, headers or request/response bodies.
		logger.info(
			{
				requestId,
				method: req.method,
				route: req.route?.path ?? 'unmatched',
				status: res.statusCode,
				durationMs: Math.round((performance.now() - started) * 100) / 100,
				aborted: !res.writableFinished,
			},
			'request completed',
		);
	};
	res.once('finish', log);
	res.once('close', log);
	next();
};
