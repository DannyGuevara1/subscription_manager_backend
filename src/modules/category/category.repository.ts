import type { Category } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
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

	async create(data: CreateCategoryData): Promise<Category> {
		return this.prisma.category.create({ data });
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
		return { categories, totalItems };
	}

	async findById(id: number): Promise<Category | null> {
		return this.prisma.category.findUnique({ where: { id } });
	}

	async update(id: number, data: UpdateCategoryData): Promise<Category> {
		return this.prisma.category.update({ where: { id }, data });
	}

	async delete(id: number): Promise<Category> {
		return this.prisma.category.delete({ where: { id } });
	}

	//Method to find category by name and userId
	async findByNameAndUserId(
		name: string,
		userId: string,
	): Promise<Category | null> {
		return this.prisma.category.findUnique({
			where: { name_userId: { name, userId } },
		});
	}
}
