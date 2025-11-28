// src/api/features/auth/types/auth.types.ts
import type { User } from '@prisma/client';
import type { SafeLoginDto } from '@/api/features/auth/dto/auth.dto.js';
export type AuthUser = Pick<User, 'id' | 'email' | 'name'>;

export interface AuthLoginResponse {
	accessToken: string;
	user: SafeLoginDto;
}

export interface JWTPayload {
	sub: string;
	email: string;
	name: string | null;
	iat?: number;
	exp?: number;
}
