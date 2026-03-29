import type { Request } from 'express';
import type { JWTPayload } from '@/modules/auth/index.js';

declare global {
	namespace Express {
		interface Request {
			user?: JWTPayload;
		}
	}
}

export type RequestWithQuery<T> = Request<unknown, unknown, unknown, T>;

// 2. Si solo necesitas tipar el Body (Ej: para crear un usuario)
export type RequestWithBody<T> = Request<unknown, unknown, T, unknown>;

// 3. Si solo necesitas tipar los Params de la URL (Ej: /users/:id)
export type RequestWithParams<T> = Request<T, unknown, unknown, unknown>;

// 4. El "Todo en uno" por si necesitas combinar (Ej: Body + Params)
export type TypedRequest<
	Body = unknown,
	Query = unknown,
	Params = unknown,
> = Request<Params, unknown, Body, Query>;

export {};
