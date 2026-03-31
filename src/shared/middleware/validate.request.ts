import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

type ValidatedShape = {
	body?: unknown;
	query?: unknown;
	params?: unknown;
};
export const validateRequest = <T extends ValidatedShape>(
	schema: ZodType<T>,
) => {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const result = await schema.safeParseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			if (!result.success) {
				return next(result.error); // ZodError — el error handler lo clasifica
			}

			const data = result.data as {
				body?: unknown;
				query?: unknown;
				params?: unknown;
			};

			req.validated = {};

			if ('body' in result.data) req.validated.body = data.body;
			if ('query' in result.data) req.validated.query = data.query;
			if ('params' in result.data) req.validated.params = data.params;

			if ('body' in result.data) req.body = data.body;

			if ('query' in result.data) {
				Object.defineProperty(req, 'query', {
					value: data.query,
					writable: true,
					configurable: true,
					enumerable: true,
				});
			}

			next();
		} catch (error) {
			if (error instanceof ZodError) {
				return next(error);
			}
			next(error);
		}
	};
};
