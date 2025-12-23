// src/modules/user/user.type.ts
import type { User } from '@prisma/client';
import type { ParamsDictionary } from 'express-serve-static-core';

export interface UserParams extends ParamsDictionary {
	id: string;
}

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
