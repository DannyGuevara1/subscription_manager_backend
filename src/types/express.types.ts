import type { JWTPayload } from '@/api/features/auth/index.ts';

declare global {
	namespace Express {
		interface Request {
			user: JWTPayload;
		}
	}
}

export {};
