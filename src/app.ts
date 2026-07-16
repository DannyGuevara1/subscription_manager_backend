// src/app.ts

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
	type NextFunction,
	type Request,
	type Response,
} from 'express';

import helmet from 'helmet';
import responseTime from 'response-time';
import v1 from '@/routes/index.js';
import {
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';
import { errorHandler } from '@/shared/middleware/error.handler.js';
import { errorNormalizer } from '@/shared/middleware/error.normalizer.js';
import {
	authLimiter,
	globalLimiter,
	heavyQueryLimiter,
} from '@/shared/middleware/rate-limiter.js';

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
	: [];



// Middlewares
app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				return callback(null, true);
			}
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			return callback(
				forbiddenError({
					detail: 'Origin not allowed by CORS policy.',
				}),
			);
		},
		credentials: true,
	}),
);
if (process.env.NODE_ENV !== 'test') {
	app.use(globalLimiter);
}
app.use(express.json({ limit: '100kb' }));
app.use(helmet());
app.use(cookieParser());
app.use(responseTime());

// Routes
if (process.env.NODE_ENV !== 'test') {
	app.use('/api/v1/auth', authLimiter);
	app.use('/api/v1/dashboard', heavyQueryLimiter);
	app.use('/api/v1/analytics', heavyQueryLimiter);
}
app.use('/api/v1', v1);
app.use((req: Request, _res: Response, next: NextFunction) => {
	next(
		notFoundError({
			resource: 'Endpoint',
			identifier: req.originalUrl,
			extensions: {
				method: req.method,
				detail: 'The requested route does not exist on this server.',
			},
		}),
	);
});
//Error handling middleware
app.use(errorNormalizer);
app.use(errorHandler);
export default app;
