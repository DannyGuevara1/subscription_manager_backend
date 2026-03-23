// src/middleware/error.handler.ts
import type { NextFunction, Request, Response } from 'express';
import logger from '@/config/logger.js';
import type { AppError } from '@/shared/errors/app.error.js';

export const errorHandler = (
	err: AppError,
	_req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (res.headersSent) {
		return next(err);
	}

	res.setHeader('Content-Type', 'application/problem+json');

	// Pasamos el objeto completo del error (del toLogFormat) para un log estructurado.
	logger.error({ error: err.toLogFormat() }, err.message);

	if (process.env.NODE_ENV === 'development') {
		res.status(err.status).json(err.toLogFormat());
		return;
	}

	if (!err.isOperational) {
		res.status(500).json({
			type: '/problems/internal-server-error',
			title: 'Internal Server Error',
			status: 500,
			detail:
				'An unexpected error occurred. Our team has been notified.',
		});
		return;
	}

	res.status(err.status).json(err.toProblemDetails());
};
