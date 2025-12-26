import { z } from 'zod';

export const createCategorySchema = z.object({
	userId: z.uuidv7(),
	name: z.string().min(1).max(100),
});

export const updateCategorySchema = z.object({
	name: z.string().min(1).max(100).optional(),
});

export const categoryParamsSchema = z.object({
	id: z.string().regex(/^\d+$/, 'Category ID must be a number'),
});

export const createCategoryRequestSchema = z.object({
	body: createCategorySchema,
});

export const updateCategoryRequestSchema = z.object({
	body: updateCategorySchema,
	params: categoryParamsSchema,
});

export const categoryByIdRequestSchema = z.object({
	params: categoryParamsSchema,
});

//RESPONSE DTOs
export const safeCategorySchema = z.object({
	id: z.number(),
	userId: z.string(),
	name: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type SafeCategoryDto = z.infer<typeof safeCategorySchema>;

// Infer the TypeScript types from the Zod schemas
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
