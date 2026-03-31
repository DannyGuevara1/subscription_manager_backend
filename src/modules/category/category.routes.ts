import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import {
	categoryOffsetPaginationRequestSchema,
	categoryParamsRequestSchema,
	createCategoryRequestSchema,
	updateCategoryRequestSchema,
} from '@/modules/category/index.js';
import { authorize } from '@/shared/middleware/authorize.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
import type CategoryController from './category.controller.js';
export const CATEGORY_PATH = '/categories';

export default function categoryRoutes(
	categoryController: CategoryController,
): ExpressRouter {
	const router = Router();
	// Category Router
	router
		.route('/')
		.get(
			authorize('ADMIN', 'USER'),
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
