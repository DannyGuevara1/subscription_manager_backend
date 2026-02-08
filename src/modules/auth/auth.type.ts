// src/modules/auth/auth.type.ts
import type { User } from '@prisma/client';
import type { SafeUserAuthDto } from '@/modules/auth/index.js';
export type AuthUser = Pick<
	User,
	'id' | 'email' | 'name' | 'primaryCurrencyCode' | 'role'
>;

export interface AuthLoginResponse {
	accessToken: string;
	refreshToken: string;
	user?: SafeUserAuthDto;
}

interface BaseJWTPayload {
	sub: string; // ID del usuario
	iat?: number;
	exp?: number;
}

export interface JWTPayload extends BaseJWTPayload {
	email: string;
	name: string | null;
	role: string;
	primaryCurrencyCode?: string;
}

export interface RefreshTokenPayload extends BaseJWTPayload {
	jti: string; // JWT ID para identificar el token de refresco
}
