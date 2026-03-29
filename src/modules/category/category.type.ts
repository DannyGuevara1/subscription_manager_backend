import type { ParamsDictionary } from 'express-serve-static-core';

export interface CategoryParams extends ParamsDictionary {
	id: string;
}

export interface CreateCategoryData {
	userId: string;
	name: string;
}

export interface UpdateCategoryData {
	name?: string;
}

export interface offsetPaginationOptions {
	offset: number;
	limit: number;
}

export interface CategoryDomain {
	id: number;
	userId: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface categoryOffsetPaginationResult {
	categories: CategoryDomain[];
	totalItems: number;
}
