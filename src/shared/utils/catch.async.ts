// src/utils/catch.async.ts
import type { NextFunction, Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

type AsyncRequestHandler<
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = ParsedQs,
> = (
	req: Request<P, ResBody, ReqBody, ReqQuery>,
	res: Response,
	next: NextFunction,
) => Promise<void>;

/**
 * The `catchAsync` function in TypeScript is a higher-order function that wraps an asynchronous
 * request handler and catches any errors that occur during its execution.
 * @param {AsyncRequestHandler} fn - AsyncRequestHandler - a function that handles asynchronous
 * requests
 * @returns A function is being returned that takes three parameters: req (Request), res (Response),
 * and next (NextFunction). Inside this function, the provided async function (fn) is called with req,
 * res, and next as arguments. If an error occurs during the execution of the async function, it is
 * caught and passed to the next middleware function using the `catch` method.
 */
export const catchAsync = <P, ResBody, ReqBody, ReqQuery>(
	fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>,
) => {
	return (
		req: Request<P, ResBody, ReqBody, ReqQuery>,
		res: Response,
		next: NextFunction,
	) => {
		fn(req, res, next).catch(next);
	};
};
