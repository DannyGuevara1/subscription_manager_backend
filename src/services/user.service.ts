// src/services/user.service.ts
import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

import {
	type CreateUserDto,
	createUserDto,
	type SafeUserDto,
	safeUserDto,
	type UpdateUserDto,
	updateUserDto,
} from '@/api/components/user/user.dto.js';
import type {
	CreateUserData,
	SafeUser,
	UpdateUserData,
} from '@/api/components/user/user.type.js';
import { ErrorFactory } from '@/errors/error.factory.js';
import type UserRepository from '@/repositories/user/user.repository.js';

export default class UserService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async createUser(data: CreateUserDto): Promise<SafeUserDto> {
		// Validate input data
		const validatedData = createUserDto.parse(data);

		const userData: CreateUserData = {
			id: uuidv7(),
			email: validatedData.email,
			password: await bcrypt.hash(validatedData.password, 10),
			name: validatedData.name,
			primaryCurrencyCode: validatedData.primaryCurrencyCode,
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
			throw ErrorFactory.notFoundError({
				resource: 'User',
				identifier: id,
				extensions: {
					detail: `No se encontró ningún usuario con ID ${id}.`,
				},
			});
		}
		return this.toSafeUserDto(user);
	}

	async updateUser(id: string, data: UpdateUserDto): Promise<SafeUserDto> {
		const validatedData = updateUserDto.parse(data);

		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw ErrorFactory.notFoundError({
				resource: 'User',
				identifier: id,
				extensions: {
					detail: `No se encontró ningún usuario con ID ${id}.`,
				},
			});
		}

		const updateData: UpdateUserData = {
			...validatedData,
			password: validatedData.password
				? await bcrypt.hash(validatedData.password, 10)
				: undefined,
		};

		const updatedUser = await this.userRepository.update(id, updateData);

		return this.toSafeUserDto(updatedUser);
	}

	async deleteUser(id: string): Promise<SafeUser> {
		const user = await this.userRepository.delete(id);

		if (!user) {
			throw ErrorFactory.notFoundError({
				resource: 'User',
				identifier: id,
				extensions: {
					detail: `No se encontró ningún usuario con ID ${id}.`,
				},
			});
		}

		return this.toSafeUserDto(user);
	}

	// Método privado para transformación segura
	private toSafeUserDto(user: User): SafeUserDto {
		return safeUserDto.parse({
			id: user.id,
			email: user.email,
			name: user.name,
			primaryCurrencyCode: user.primaryCurrencyCode,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	}
}
