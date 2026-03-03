import type { Category } from '@prisma/client';
import {
	type CreateCategoryDto,
	type SafeCategoryDto,
	safeCategorySchema,
	type UpdateCategoryDto,
} from '@/modules/category/category.dto.js';
import type CategoryRepository from '@/modules/category/category.repository.js';
import type {
	CreateCategoryData,
	UpdateCategoryData,
} from '@/modules/category/category.type.js';
import type UserService from '@/modules/user/user.service.js';
import {
	conflictError,
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';

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

	async getAllCategories(userId: string): Promise<SafeCategoryDto[]> {
		const categories = await this.categoryRepository.findAll(userId);
		return categories.map((category) => safeCategorySchema.parse(category));
	}

	async getCategoryById(id: number, userId: string): Promise<SafeCategoryDto> {
		const category = await this.categoryRepository.findById(id);
		if (!category) {
			throw notFoundError({
				resource: 'Category',
				identifier: `${id}`,
				extensions: {
					detail: `No se encontro una categoria con el ID ${id}`,
				},
			});
		}

		if (category.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para acceder a esta categoría.`,
				instance: `/categories/${id}`,
			});
		}
		return safeCategorySchema.parse(category);
	}

	//Methods POST
	async createCategory(data: CreateCategoryDto): Promise<SafeCategoryDto> {
		// Validate user existence
		await this.userService.getUserById(data.userId);

		// Check for existing category with the same name for the user
		await this.checkNameConflict(data.name, data.userId);

		const categoryData: CreateCategoryData = {
			...data,
		};

		return this.categoryRepository.create(categoryData);
	}

	//Methods PUT
	async updateCategory(id: number, data: UpdateCategoryDto): Promise<Category> {
		const { name } = data;

		const existingCategory = await this.categoryRepository.findById(id);
		if (!existingCategory) {
			throw notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: `No se encontró la categoría que desea actualizar.`,
				},
			});
		}
		// Check if the category exists
		if (name) {
			await this.checkNameConflict(name, existingCategory.userId, id);
		}

		const updateData: UpdateCategoryData = {
			...(name && { name }),
		};

		return this.categoryRepository.update(id, updateData);
	}

	//Methods DELETE
	async deleteCategory(id: number, userId: string): Promise<Category> {
		// Check if the category exists
		const existingCategory = await this.categoryRepository.findById(id);

		if (!existingCategory) {
			throw notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: `No se encontró la categoría que desea eliminar.`,
				},
			});
		}

		if (existingCategory.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para eliminar esta categoría.`,
				instance: `/categories/${id}`,
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
			throw conflictError({
				detail: `La categoría '${name}' ya existe para este usuario.`,
				resource: 'Category',
				identifier: existingCategory.id,
			});
		}
	}
}
