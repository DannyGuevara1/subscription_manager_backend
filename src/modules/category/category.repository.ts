import type { Category } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	CategoryDomain,
	CreateCategoryData,
	categoryOffsetPaginationResult,
	offsetPaginationOptions,
	UpdateCategoryData,
} from '@/modules/category/category.type.js';

// Category Repository for CRUD operations and querying categories
export default class CategoryRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	private toDomain(category: Category): CategoryDomain {
		return {
			id: category.id,
			name: category.name,
			userId: category.userId,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		};
	}

	async create(data: CreateCategoryData): Promise<CategoryDomain> {
		const category = await this.prisma.category.create({ data });
		return this.toDomain(category);
	}

	async findAll(
		userId: string,
		{ offset, limit }: offsetPaginationOptions,
	): Promise<categoryOffsetPaginationResult> {
		const [categories, totalItems] = await this.prisma.$transaction([
			this.prisma.category.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				skip: offset,
				take: limit,
			}),
			this.prisma.category.count({ where: { userId } }),
		]);
		return {
			categories: categories.map((category) => this.toDomain(category)),
			totalItems,
		};
	}

	async findById(id: number): Promise<CategoryDomain | null> {
		const category = await this.prisma.category.findUnique({ where: { id } });
		return category ? this.toDomain(category) : null;
	}

	async update(id: number, data: UpdateCategoryData): Promise<CategoryDomain> {
		const category = await this.prisma.category.update({ where: { id }, data });
		return this.toDomain(category);
	}

	async delete(id: number): Promise<CategoryDomain> {
		const category = await this.prisma.category.delete({ where: { id } });
		return this.toDomain(category);
	}

	//Method to find category by name and userId
	async findByNameAndUserId(
		name: string,
		userId: string,
	): Promise<CategoryDomain | null> {
		const category = await this.prisma.category.findUnique({
			where: { name_userId: { name, userId } },
		});
		return category ? this.toDomain(category) : null;
	}
}
