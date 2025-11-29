import { z } from 'zod';

export const createCategoryDto = z.object({
	userId: z.uuidv7(),
	name: z.string().min(1).max(100),
});

export const updateCategoryDto = z.object({
	name: z.string().min(1).max(100).optional(),
});

//RESPONSE DTOs
export const safeCategoryDto = z.object({
	id: z.number(),
	name: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Infer the TypeScript types from the Zod schemas
export type SafeCategoryDto = z.infer<typeof safeCategoryDto>;
export type CreateCategoryInput = z.infer<typeof createCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryDto>;
