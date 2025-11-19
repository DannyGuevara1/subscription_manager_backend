// src/app.ts

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from '@/middleware/error.handler.js';
import { errorNormalizer } from '@/middleware/error.normalizer.js';
import v1 from '@/routes/index.js';

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

// Routes
app.use('/api/v1', v1);

//Error handling middleware
app.use(errorNormalizer);
app.use(errorHandler);
export default app;
