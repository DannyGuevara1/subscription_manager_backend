import { Router } from 'express';
import { catchAsync } from '@/utils/catch.async.js';
import type CategoryController from './category.controller.js';

export const path = '/categories';

export default function categoryRoutes(categoryController: CategoryController) {
	const router = Router();
	// Category Router
	router
		.route('/')
		.get(
			catchAsync(categoryController.getAllCategories.bind(categoryController)),
		)
		.post(
			catchAsync(categoryController.createCategory.bind(categoryController)),
		);

	router
		.route('/:id')
		.get(
			catchAsync(categoryController.getByCategoryId.bind(categoryController)),
		)
		.put(catchAsync(categoryController.updateCategory.bind(categoryController)))
		.delete(
			catchAsync(categoryController.deleteCategory.bind(categoryController)),
		);
	return router;
}
