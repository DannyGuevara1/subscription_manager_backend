import type { ParamsDictionary } from 'express-serve-static-core';

export interface categoryParams extends ParamsDictionary {
	id: string;
}

export interface CreateCategoryData {
	userId: string;
	name: string;
}

export interface UpdateCategoryData {
	name?: string;
}
