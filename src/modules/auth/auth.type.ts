// src/modules/auth/auth.type.ts
import type { User } from '@prisma/client';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
export type AuthUser = Pick<
	User,
	'id' | 'email' | 'name' | 'primaryCurrencyCode'
>;

export interface AuthLoginResponse {
	accessToken: string;
	user: SafeUserAuthDto;
}

export interface JWTPayload {
	sub: string;
	email: string;
	name: string | null;
	primaryCurrencyCode: string;
	iat?: number;
	exp?: number;
}
