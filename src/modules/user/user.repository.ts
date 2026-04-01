// src/repositories/user/user.repository.ts
import type { User } from '@prisma/client';
import prismaClient from '@/config/prisma.js';
import type {
	CreateUserData,
	UserDomain,
	UserOffsetPaginationOptions,
	UserOffsetPaginationResult,
	UpdateUserData,
	UpdateUserRoleData,
} from '@/modules/user/user.type.js';

export default class UserRepository {
	private readonly prisma;

	constructor(prisma = prismaClient) {
		this.prisma = prisma;
	}

	private toDomain(user: User): UserDomain {
		return {
			id: user.id,
			name: user.name,
			email: user.email,
			password: user.password,
			primaryCurrencyCode: user.primaryCurrencyCode,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}
	// CRUD Operations
	async create(data: CreateUserData): Promise<UserDomain> {
		const user = await this.prisma.user.create({ data });
		return this.toDomain(user);
	}

	async findAll(
		{ offset, limit }: UserOffsetPaginationOptions,
	): Promise<UserOffsetPaginationResult> {
		const [users, totalItems] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				orderBy: { createdAt: 'desc' },
				skip: offset,
				take: limit,
			}),
			this.prisma.user.count(),
		]);

		return {
			users: users.map((user) => this.toDomain(user)),
			totalItems,
		};
	}

	async findById(id: string): Promise<UserDomain | null> {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});

		return user ? this.toDomain(user) : null;
	}

	async findByEmail(email: string): Promise<UserDomain | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		return user ? this.toDomain(user) : null;
	}

	async update(id: string, data: UpdateUserData): Promise<UserDomain> {
		const user = await this.prisma.user.update({ where: { id }, data });
		return this.toDomain(user);
	}

	async updateRole(id: string, data: UpdateUserRoleData): Promise<UserDomain> {
		const user = await this.prisma.user.update({ where: { id }, data });
		return this.toDomain(user);
	}

	async delete(id: string): Promise<UserDomain> {
		const user = await this.prisma.user.delete({ where: { id } });
		return this.toDomain(user);
	}
}
