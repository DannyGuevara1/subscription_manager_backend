interface CursorPaginationWindow<T, TCursor> {
	items: T[];
	nextCursor: TCursor | null;
	hasNextPage: boolean;
}

interface BuildCursorPaginationWindowParams<T, TCursor> {
	items: T[];
	limit: number;
	getCursor: (item: T) => TCursor;
}

export function buildCursorPaginationWindow<T, TCursor>({
	items,
	limit,
	getCursor,
}: BuildCursorPaginationWindowParams<T, TCursor>): CursorPaginationWindow<
	T,
	TCursor
> {
	const hasNextPage = items.length > limit;
	const paginatedItems = hasNextPage ? items.slice(0, limit) : items;

	if (!hasNextPage || paginatedItems.length === 0) {
		return {
			items: paginatedItems,
			nextCursor: null,
			hasNextPage,
		};
	}

	const lastItem = paginatedItems[paginatedItems.length - 1];

	if (!lastItem) {
		return {
			items: paginatedItems,
			nextCursor: null,
			hasNextPage,
		};
	}

	return {
		items: paginatedItems,
		nextCursor: getCursor(lastItem),
		hasNextPage,
	};
}