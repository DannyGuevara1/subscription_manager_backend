import type { JWTPayload } from '@/modules/auth/index.js';

declare global {
	namespace Express {
		interface Request {
			user?: JWTPayload;
			validated: {
				body?: unknown;
				query?: unknown;
				params?: unknown;
			};
		}
	}
}
