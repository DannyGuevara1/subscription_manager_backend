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
import { errorHandler } from '@/shared/middleware/error.handler.js';
import { errorNormalizer } from '@/shared/middleware/error.normalizer.js';
import { notFoundError } from './shared/errors/error.factory.js';

/*
investigar sobre rate-limiter-flexible para limitar peticiones
y ante todo buscar la buenas practicas y estandares profesionales
de desarrollo con express y typescript
*/

const app = express();

const whitelist = ['http://localhost:3000'];

// Middlewares
app.use(
	cors({
		origin(origin, callback) {
			if (origin && whitelist.includes(origin)) {
				return callback(null, true);
			}
			// TODO: cambiar el mensaje de error
			return callback(new Error('Not allowed by CORS'));
		},
	}),
);
app.use(express.json());
app.use(helmet());
app.use(cookieParser());
app.use(responseTime());

// Routes
app.use('/api/v1', v1);
app.use((req: Request, _res: Response, next: NextFunction) => {
	next(
		notFoundError({
			resource: 'Endpoint',
			identifier: req.originalUrl,
			extensions: {
				method: req.method,
				detail: `La ruta solicitada no existe en este servidor.`,
			},
		}),
	);
});
//Error handling middleware
app.use(errorNormalizer);
app.use(errorHandler);
export default app;
