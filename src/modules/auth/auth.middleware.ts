import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';
export const authMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	try {
		const ACCESS_TOKEN = req.cookies.ACCESS_TOKEN;
		if (!ACCESS_TOKEN) {
			return next(
				ErrorFactory.unauthorizedError({
					detail: 'Access token is missing',
				}),
			);
		}

		const SECRET_KEY = process.env.JWT_SECRET as string;

		if (!SECRET_KEY) {
			return next(
				ErrorFactory.internalError({
					detail: 'JWT secret key is not configured',
					isOperational: false,
					context: {
						severity: 'critical',
						timestamp: new Date().toISOString(),
					},
					metadata: {
						service: 'auth-middleware',
						errorType: 'ConfigurationError',
					},
				}),
			);
		}

		const decode = jwt.verify(ACCESS_TOKEN, SECRET_KEY) as JWTPayload;
		req.user = decode;
		next();
	} catch (_error) {
		return next(
			ErrorFactory.unauthorizedError({
				detail: 'Invalid access token',
			}),
		);
	}
};
