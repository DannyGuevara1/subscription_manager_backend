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

	// Do not log validation input values, which can contain passwords or tokens.
	logger.error(
		{
			requestId: res.locals.requestId,
			status: err.status,
			problemType: err.type,
		},
		'request failed',
	);

	if (process.env.NODE_ENV === 'development') {
		res.status(err.status).json(err.toLogFormat());
		return;
	}

	if (!err.isOperational) {
		res.status(500).json({
			type: '/problems/internal-server-error',
			title: 'Internal Server Error',
			status: 500,
			detail: 'An unexpected error occurred. Our team has been notified.',
		});
		return;
	}

	res.status(err.status).json(err.toProblemDetails());
};
