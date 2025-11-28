import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/api/features/auth/types/auth.type.js';
import { ErrorFactory } from '@/errors/error.factory.js';
export const authMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	try {
		const accessToken = req.cookies.accessToken;
		if (!accessToken) {
			return next(
				ErrorFactory.internalError({
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

		const decode = jwt.verify(accessToken, SECRET_KEY) as JWTPayload;
		req.user = decode;
		next();
	} catch (error) {
		return next(
			ErrorFactory.internalError({
				detail: 'Invalid access token',
			}),
		);
	}
};
