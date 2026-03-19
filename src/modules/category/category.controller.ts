import type { NextFunction, Request, Response } from 'express';
import type CategoryService from '@/modules/category/category.service.js';
import type { categoryParams } from '@/modules/category/index.js';

export default class CategoryController {
	private categoryService: CategoryService;

	constructor(categoryService: CategoryService) {
		this.categoryService = categoryService;
	}

	//Controller method to get all categories
	async getAllCategories(req: Request, res: Response, _next: NextFunction) {
		const userId = req.user?.sub as string;
		const categories = await this.categoryService.getAllCategories(userId);
		res.status(200).json({
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
		const sub = req.user?.sub as string;
		const category = await this.categoryService.getCategoryById(
			Number(id),
			sub,
		);
		res.status(200).json({
			data: category,
		});
	}

	//Controller method to create a new category
	async createCategory(req: Request, res: Response, _next: NextFunction) {
		const categoryData = req.body;
		const authUser = req.user as NonNullable<Request['user']>;
		const newCategory = await this.categoryService.createCategory(
			categoryData,
			authUser,
		);

		res.status(201).json({
			data: newCategory,
		});
	}

	async updateCategory(
		req: Request<categoryParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const categoryData = req.body;
		const sub = req.user?.sub as string;
		const updatedCategory = await this.categoryService.updateCategory(
			Number(id),
			categoryData,
			sub,
		);

		res.status(200).json({
			data: updatedCategory,
		});
	}

	async deleteCategory(
		req: Request<categoryParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const sub = req.user?.sub as string;
		await this.categoryService.deleteCategory(Number(id), sub);

		res.status(204).send();
	}
}
