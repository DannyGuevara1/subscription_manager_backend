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

export type CreateCategoryInput = Omit<CreateCategoryData, 'userId'>;

export interface CategoryOffsetPaginationInput {
	page: number;
	limit: number;
}
