// src/modules/user/user.type.ts
import type { ParamsDictionary } from 'express-serve-static-core';
import type { Role } from '@/shared/types/domain.enums.js';

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

export interface UpdateUserRoleData {
	role: Role;
}

export interface UserDomain {
	id: string;
	name: string | null;
	email: string;
	password: string;
	primaryCurrencyCode: string;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserOffsetPaginationInput {
	page: number;
	limit: number;
}

export interface UserOffsetPaginationOptions {
	offset: number;
	limit: number;
}

export interface UserOffsetPaginationResult {
	users: UserDomain[];
	totalItems: number;
}
