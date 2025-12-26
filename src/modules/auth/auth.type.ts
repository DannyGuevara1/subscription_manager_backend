// src/modules/auth/auth.type.ts
import type { User } from '@prisma/client';
import type { SafeUserDto } from '@/modules/user/index.js';
export type AuthUser = Pick<User, 'id' | 'email' | 'name'>;

export interface AuthLoginResponse {
	accessToken: string;
	user: SafeUserDto;
}

export interface JWTPayload {
	sub: string;
	email: string;
	name: string | null;
	iat?: number;
	exp?: number;
}
