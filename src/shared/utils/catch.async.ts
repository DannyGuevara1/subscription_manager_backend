// src/utils/catch.async.ts
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

type AsyncRequestHandler<
	P extends ParamsDictionary = ParamsDictionary,
	ResBody = unknown,
	ReqBody = unknown,
	ReqQuery extends ParsedQs = ParsedQs,
> = (
	req: Request<P, ResBody, ReqBody, ReqQuery>,
	res: Response,
	next: NextFunction,
) => Promise<void>;

/**
 * Wraps an async Express handler to forward unhandled rejections
 * to the next error-handling middleware.
 *
 * @example
 * in controller:
 * router.get('/users', catchAsync(async (req, res) => {
 *   const users = await UserService.findAll();
 *   res.json(users);
 * }));
 *
 * @example
 * in routes:
 * router.get('/users', catchAsync(userController.getAllUsers.bind(userController)));
 */
export const catchAsync = <
	P extends ParamsDictionary = ParamsDictionary,
	ResBody = unknown,
	ReqBody = unknown,
	ReqQuery extends ParsedQs = ParsedQs,
>(
	fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	};
};
