import type { JWTPayload } from '@/modules/auth/auth.type.js';
import type CategoryRepository from '@/modules/category/category.repository.js';
import type {
	CategoryDomain,
	CategoryOffsetPaginationInput,
	CreateCategoryInput,
	CreateCategoryData,
	UpdateCategoryData,
} from '@/modules/category/category.type.js';
import {
	conflictError,
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';

import {
	buildPaginationMeta,
	calculateOffset,
} from '@/shared/utils/pagination-offset.util.js';

export default class CategoryService {
	private categoryRepository: CategoryRepository;

	constructor(categoryRepository: CategoryRepository) {
		this.categoryRepository = categoryRepository;
	}

	//Methods GET

	async getAllCategories(
		userId: string,
		{ page, limit }: CategoryOffsetPaginationInput,
	): Promise<{
		categories: CategoryDomain[];
		meta: ReturnType<typeof buildPaginationMeta>;
	}> {
		const offset = calculateOffset(page, limit);
		const { categories, totalItems } = await this.categoryRepository.findAll(
			userId,
			{
				offset,
				limit,
			},
		);

		const meta = buildPaginationMeta({
			page,
			limit,
			totalItems: totalItems,
		});

		return {
			categories,
			meta,
		};
	}

	async getCategoryById(id: number, userId: string): Promise<CategoryDomain> {
		const category = await this.categoryRepository.findById(id);
		if (!category) {
			throw notFoundError({
				resource: 'Category',
				identifier: `${id}`,
				extensions: {
					detail: `No category found with ID ${id}.`,
				},
			});
		}

		if (category.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to access this category.',
				instance: `/categories/${id}`,
			});
		}
		return category;
	}

	//Methods POST
	async createCategory(
		data: CreateCategoryInput,
		authUser: JWTPayload,
	): Promise<CategoryDomain> {
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
		data: UpdateCategoryData,
		userId: string,
	): Promise<CategoryDomain> {
		const { name } = data;

		const existingCategory = await this.categoryRepository.findById(id);
		if (!existingCategory) {
			throw notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: 'The category you are trying to update was not found.',
				},
			});
		}
		if (existingCategory.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to update this category.',
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
	async deleteCategory(id: number, userId: string): Promise<CategoryDomain> {
		// Check if the category exists
		const existingCategory = await this.categoryRepository.findById(id);

		if (!existingCategory) {
			throw notFoundError({
				resource: 'Category',
				identifier: id,
				extensions: {
					detail: 'The category you are trying to delete was not found.',
				},
			});
		}

		if (existingCategory.userId !== userId) {
			throw forbiddenError({
				detail: 'You do not have permission to delete this category.',
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
				detail: `Category '${name}' already exists for this user.`,
				resource: 'Category',
				identifier: existingCategory.id,
			});
		}
	}
}
