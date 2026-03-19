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
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import {
	conflictError,
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';

export default class CategoryService {
	private categoryRepository: CategoryRepository;

	constructor(categoryRepository: CategoryRepository) {
		this.categoryRepository = categoryRepository;
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
	async createCategory(
		data: CreateCategoryDto,
		authUser: JWTPayload,
	): Promise<SafeCategoryDto> {
		const userId = authUser.sub;

		// Check for existing category with the same name for the user
		await this.checkNameConflict(data.name, userId);

		const categoryData: CreateCategoryData = {
			userId,
			name: data.name,
		};

		return this.categoryRepository.create(categoryData);
	}

	//Methods PUT
	async updateCategory(
		id: number,
		data: UpdateCategoryDto,
		userId: string,
	): Promise<Category> {
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
		if (existingCategory.userId !== userId) {
			throw forbiddenError({
				detail: `No tiene permiso para actualizar esta categoría.`,
				instance: `/categories/${id}`,
			});
		}
		// Check if the category exists
		if (name) {
			await this.checkNameConflict(name, userId, id);
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
