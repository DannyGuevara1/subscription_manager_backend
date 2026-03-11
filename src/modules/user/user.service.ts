// src/services/user.service.ts
import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import type { CreateUserData, UpdateUserData } from '@/modules/user/index.js';
import {
	type CreateUserDto,
	type SafeUserDto,
	safeUserSchema,
	type UpdateUserDto,
} from '@/modules/user/index.js';
import type UserRepository from '@/modules/user/user.repository.js';
import {
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';

export default class UserService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async createUser(data: CreateUserDto): Promise<SafeUserDto> {
		const { email, password, name, primaryCurrencyCode } = data;

		const userData: CreateUserData = {
			id: uuidv7(),
			email: email,
			password: await bcrypt.hash(password, 10),
			name: name,
			primaryCurrencyCode: primaryCurrencyCode,
		};

		const newUser: User = await this.userRepository.create(userData);

		return this.toSafeUserDto(newUser);
	}

	async getAllUsers(): Promise<SafeUserDto[]> {
		const users: User[] = await this.userRepository.findAll();
		return users.map((user) => this.toSafeUserDto(user));
	}

	async getUserById(id: string): Promise<SafeUserDto> {
		const user: User | null = await this.userRepository.findById(id);
		if (!user) {
			throw this.userNotFoundError(id);
		}

		return this.toSafeUserDto(user);
	}

	async updateUser(
		id: string,
		data: UpdateUserDto,
		userId: string,
	): Promise<SafeUserDto> {
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}

		if (existingUser.id !== userId) {
			throw this.accessDeniedError();
		}

		const { password } = data;

		const updateData: UpdateUserData = {
			...data,
			password: password ? await bcrypt.hash(password, 10) : undefined,
		};

		const updatedUser = await this.userRepository.update(id, updateData);

		return this.toSafeUserDto(updatedUser);
	}

	async deleteUser(id: string, userId: string): Promise<SafeUserDto> {
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}
		if (existingUser.id !== userId) {
			throw this.accessDeniedError();
		}
		await this.userRepository.delete(id);

		return this.toSafeUserDto(existingUser);
	}

	// Método privado para transformación segura
	private toSafeUserDto(user: User): SafeUserDto {
		return safeUserSchema.parse({
			id: user.id,
			email: user.email,
			name: user.name,
			primaryCurrencyCode: user.primaryCurrencyCode,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	}

	// Abtraer mensaje de error de usuario no encontrado
	private userNotFoundError(id: string) {
		return notFoundError({
			resource: 'User',
			identifier: id,
			extensions: {
				detail: `No se encontró ningún usuario con ID ${id}.`,
			},
		});
	}

	private accessDeniedError() {
		return forbiddenError({
			detail: `No tiene permiso para acceder a este recurso.`,
		});
	}
}
