import { Router } from 'express';
import {
	categoryOffsetPaginationRequestSchema,
	categoryParamsRequestSchema,
	createCategoryRequestSchema,
	updateCategoryRequestSchema,
} from '@/modules/category/index.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
import type CategoryController from './category.controller.js';
export const path = '/categories';

export default function categoryRoutes(categoryController: CategoryController) {
	const router = Router();
	// Category Router
	router
		.route('/')
		.get(
			validateRequest(categoryOffsetPaginationRequestSchema),
			catchAsync(categoryController.getAllCategories.bind(categoryController)),
		)
		.post(
			validateRequest(createCategoryRequestSchema),
			catchAsync(categoryController.createCategory.bind(categoryController)),
		);

	router
		.route('/:id')
		.get(
			validateRequest(categoryParamsRequestSchema),
			catchAsync(categoryController.getByCategoryId.bind(categoryController)),
		)
		.put(
			validateRequest(updateCategoryRequestSchema),
			catchAsync(categoryController.updateCategory.bind(categoryController)),
		)
		.delete(
			validateRequest(categoryParamsRequestSchema),
			catchAsync(categoryController.deleteCategory.bind(categoryController)),
		);
	return router;
}
