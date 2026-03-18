// src/modules/auth/auth.type.ts
import type { Role } from '@/shared/types/domain.enums.js';
export interface AuthUser {
	id: string;
	email: string;
	name: string | null;
	primaryCurrencyCode: string;
	role: Role;
}

export interface AuthLoginResponse {
	accessToken: string;
	refreshToken: string;
	user?: AuthUser;
}

interface BaseJWTPayload {
	sub: string; // ID del usuario
	iat?: number;
	exp?: number;
}

export interface JWTPayload extends BaseJWTPayload {
	email: string;
	name: string | null;
	role: Role;
	primaryCurrencyCode?: string;
}

export interface RefreshTokenPayload extends BaseJWTPayload {
	jti: string; // JWT ID para identificar el token de refresco
}
