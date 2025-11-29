// src/repositories/user/user.repository.ts
import type { User } from '@prisma/client';
import type {
	CreateUserData,
	UpdateUserData,
} from '@/modules/user/user.type.js';
import prismaClient from '@/config/prisma.js';

export default class UserRepository {
	private readonly prisma;

	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}
	// CRUD Operations
	async create(data: CreateUserData): Promise<User> {
		return this.prisma.user.create({ data });
	}

	async findAll(): Promise<User[]> {
		return this.prisma.user.findMany();
	}

	async findById(id: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { id },
		});
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { email },
		});
	}

	async update(id: string, data: UpdateUserData): Promise<User> {
		return this.prisma.user.update({ where: { id }, data });
	}

	async delete(id: string): Promise<User | null> {
		return this.prisma.user.delete({ where: { id } });
	}
}
