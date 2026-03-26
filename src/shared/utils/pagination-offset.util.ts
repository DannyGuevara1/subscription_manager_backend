interface PaginationMeta {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	limit: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface BuildPaginationMetaParams {
	totalItems: number;
	page: number;
	limit: number;
}

export function buildPaginationMeta({
	totalItems,
	page,
	limit,
}: BuildPaginationMetaParams): PaginationMeta {
	const totalPages = Math.ceil(totalItems / limit);

	return {
		totalItems,
		totalPages,
		currentPage: page,
		limit,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
}

export function calculateOffset(page: number, limit: number): number {
	return (page - 1) * limit;
}
