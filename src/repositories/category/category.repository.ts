import type { Category } from '@prisma/client';
import type {
	CreateCategoryData,
	UpdateCategoryData,
} from '@/api/components/category/category.type.js';
import prismaClient from '@/config/prisma.js';

// Category Repository for CRUD operations and querying categories
export default class CategoryRepository {
	private readonly prisma;
	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	async create(data: CreateCategoryData): Promise<Category> {
		return this.prisma.category.create({ data });
	}

	async findAll(): Promise<Category[]> {
		return this.prisma.category.findMany();
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
