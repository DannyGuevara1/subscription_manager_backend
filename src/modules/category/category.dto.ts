import { z } from 'zod';

// SCHEMAS FOR VALIDATION QUERIES PARAMS.
export const categoryOffsetPaginationQuerySchema = z.object({
	page: z.coerce
		.number({ error: 'Page must be a number' })
		.int({ error: 'Page must be an integer' })
		.min(1, 'Page must be at least 1')
		.default(1),
	limit: z.coerce
		.number({ error: 'Limit must be a number' })
		.int({ error: 'Limit must be an integer' })
		.min(1, 'limit must be at least 1')
		.max(100, 'limit must be at most 100')
		.default(10),
});
//SCHEMAS
export const createCategorySchema = z.object({
	name: z.string().min(1).max(100),
});

export const updateCategorySchema = z.object({
	name: z.string().min(1).max(100).optional(),
});

export const categoryParamsSchema = z.object({
	id: z.coerce
		.number({ error: 'Id must be a number' })
		.int({ error: 'Id must be a valid integer' })
		.positive({ error: 'Id must be greater than 0' }),
});

//REQUEST SCHEMAS FOR VALIDATION IN ROUTES
export const createCategoryRequestSchema = z.object({
	body: createCategorySchema,
});

export const updateCategoryRequestSchema = z.object({
	body: updateCategorySchema,
	params: categoryParamsSchema,
});

export const categoryParamsRequestSchema = z.object({
	params: categoryParamsSchema,
});

export const categoryOffsetPaginationRequestSchema = z.object({
	query: categoryOffsetPaginationQuerySchema,
});

//RESPONSE DTOs
export const safeCategorySchema = z.object({
	id: z.number(),
	userId: z.string(),
	name: z.string(),
});

export type SafeCategoryDto = z.infer<typeof safeCategorySchema>;

// Infer the TypeScript types from the Zod schemas
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryOffsetPaginationParamsDto = z.infer<
	typeof categoryOffsetPaginationQuerySchema
>;
export type CategoryParamsDto = z.infer<typeof categoryParamsSchema>;
