import type { Category } from '@prisma/client';
import {
	type CreateCategoryInput,
	createCategoryDto,
	type SafeCategoryDto,
	safeCategoryDto,
	type UpdateCategoryInput,
	updateCategoryDto,
} from '@/api/components/category/category.dto.js';
import type {
	CreateCategoryData,
	UpdateCategoryData,
} from '@/api/components/category/category.type.js';
import { ErrorFactory } from '@/errors/error.factory.js';
import type CategoryRepository from '@/repositories/category/category.repository.js';
import type UserService from '@/services/user.service.js';

export default class CategoryService {
	private categoryRepository: CategoryRepository;
	private userService: UserService;

	constructor(
		categoryRepository: CategoryRepository,
		userService: UserService,
	) {
		this.categoryRepository = categoryRepository;
		this.userService = userService;
	}

	//Methods GET

	async getAllCategories(): Promise<SafeCategoryDto[]> {
		const categories = await this.categoryRepository.findAll();
		return categories.map((category) => safeCategoryDto.parse(category));
	}

	async getCategoryById(id: number): Promise<SafeCategoryDto> {
		const category = await this.categoryRepository.findById(id);
		if (!category) {
			throw ErrorFactory.notFoundError({
				resource: 'Category',
				identifier: `${id}`,
				extensions: {
					detail: `No se encontro una categoria con el ID ${id}`,
				},
			});
		}
		return safeCategoryDto.parse(category);
	}

	//Methods POST
	async createCategory(data: CreateCategoryInput): Promise<SafeCategoryDto> {
		// Validate user existence
		await this.userService.getUserById(data.userId);

		// Validate category data
		const parsedData = createCategoryDto.parse(data);
		// Check for existing category with the same name for the user
		await this.checkNameConflict(parsedData.name, parsedData.userId);

		const categoryData: CreateCategoryData = {
			...parsedData,
		};

		return this.categoryRepository.create(categoryData);
	}

	//Methods PUT
	async updateCategory(
		id: number,
		data: UpdateCategoryInput,
	): Promise<Category> {
		// Validate category data
		const parsedData = updateCategoryDto.parse(data);

		const existingCategory = await this.categoryRepository.findById(id);
		if (!existingCategory) {
			throw ErrorFactory.notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: `No se encontró la categoría que desea actualizar.`,
				},
			});
		}
		// Check if the category exists
		if (parsedData.name) {
			await this.checkNameConflict(
				parsedData.name,
				existingCategory.userId,
				id,
			);
		}

		const updateData: UpdateCategoryData = {
			...(parsedData.name && { name: parsedData.name }),
		};

		return this.categoryRepository.update(id, updateData);
	}

	//Methods DELETE
	async deleteCategory(id: number): Promise<Category> {
		// Check if the category exists
		const existingCategory = await this.categoryRepository.findById(id);

		if (!existingCategory) {
			throw ErrorFactory.notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: `No se encontró la categoría que desea eliminar.`,
				},
			});
		}

		return this.categoryRepository.delete(id);
	}

	private async checkNameConflict(
		name: string,
		userId: string,
		excludeId?: number,
	): Promise<void> {
		const existingCategory = await this.categoryRepository.findByNameAndUserId(
			name,
			userId,
		);

		if (existingCategory && existingCategory.id !== excludeId) {
			throw ErrorFactory.conflictError({
				detail: `La categoría '${name}' ya existe para este usuario.`,
				resource: 'Category',
				identifier: existingCategory.id,
			});
		}
	}
}
