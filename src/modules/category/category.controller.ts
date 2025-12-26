import type { NextFunction, Request, Response } from 'express';
import type CategoryService from '@/modules/category/category.service.js';
import type { categoryParams } from '@/modules/category/index.js';

export default class CategoryController {
	private categoryService: CategoryService;

	constructor(categoryService: CategoryService) {
		this.categoryService = categoryService;
	}

	//Controller method to get all categories
	async getAllCategories(_req: Request, res: Response, _next: NextFunction) {
		const categories = await this.categoryService.getAllCategories();
		res.status(200).json({
			status: 'success',
			data: { categories },
		});
	}

	//Controller method to get id category

	async getByCategoryId(
		req: Request<categoryParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const category = await this.categoryService.getCategoryById(Number(id));
		res.status(200).json({
			status: 'success',
			data: { ...category },
		});
	}

	//Controller method to create a new category
	async createCategory(req: Request, res: Response, _next: NextFunction) {
		const categoryData = req.body;
		const newCategory = await this.categoryService.createCategory(categoryData);

		res.status(201).json({
			status: 'success',
			data: { ...newCategory },
		});
	}

	async updateCategory(
		req: Request<categoryParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const categoryData = req.body;
		const updatedCategory = await this.categoryService.updateCategory(
			Number(id),
			categoryData,
		);

		res.status(200).json({
			status: 'success',
			data: { ...updatedCategory },
		});
	}

	async deleteCategory(
		req: Request<categoryParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const deletedCategory = await this.categoryService.deleteCategory(
			Number(id),
		);

		res.status(200).json({
			status: 'success',
			data: { ...deletedCategory },
		});
	}
}
