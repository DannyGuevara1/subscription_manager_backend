// src/app.ts

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
	type NextFunction,
	type Request,
	type Response,
} from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import responseTime from 'response-time';
import v1 from '@/routes/index.js';
import { notFoundError } from '@/shared/errors/error.factory.js';
import { errorHandler } from '@/shared/middleware/error.handler.js';
import { errorNormalizer } from '@/shared/middleware/error.normalizer.js';

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
	? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
	: [];

const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
		detail: 'You have exceeded the request limit. Please try again later.',
	},
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
		detail: 'Too many authentication attempts. Please try again later.',
	},
});

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
			return callback(new Error('Not allowed by CORS'));
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
