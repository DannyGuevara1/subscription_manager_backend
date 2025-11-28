// src/api/components/user/user.type.ts
import type { User } from '@prisma/client';

export interface CreateUserData {
	id: string;
	name?: string;
	email: string;
	password: string;
	primaryCurrencyCode: string;
}

export interface UpdateUserData {
	name?: string;
	email?: string;
	password?: string;
	primaryCurrencyCode?: string;
}

export type SafeUser = Omit<User, 'password'>;
