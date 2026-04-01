// src/services/user.service.ts
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import type { JWTPayload } from '@/modules/auth/index.js';
import type {
	CreateUserData,
	ProfileDto,
	UpdateUserData,
	UserDomain,
	UserOffsetPaginationInput,
} from '@/modules/user/index.js';
import {
	type CreateUserDto,
	type SafeUserDto,
	safeUserSchema,
	type UpdateUserDto,
	type SupportUserDto,
	supportUserSchema,
} from '@/modules/user/index.js';
import type UserRepository from '@/modules/user/user.repository.js';
import {
	forbiddenError,
	notFoundError,
} from '@/shared/errors/error.factory.js';
import type { Role } from '@/shared/types/domain.enums.js';
import { ROLE_VALUES } from '@/shared/types/domain.enums.js';
import {
	buildPaginationMeta,
	calculateOffset,
} from '@/shared/utils/pagination-offset.util.js';

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

		const newUser = await this.userRepository.create(userData);

		return this.toSafeUserDto(newUser);
	}

	async getAllUsers(
		{ page, limit }: UserOffsetPaginationInput,
	): Promise<{
		users: SafeUserDto[];
		meta: ReturnType<typeof buildPaginationMeta>;
	}> {
		const offset = calculateOffset(page, limit);
		const { users, totalItems } = await this.userRepository.findAll({
			offset,
			limit,
		});

		const meta = buildPaginationMeta({
			totalItems,
			page,
			limit,
		});

		return {
			users: users.map((user) => this.toSafeUserDto(user)),
			meta,
		};
	}

	async getUserByIdInternal(id: string): Promise<SafeUserDto> {
		const user = await this.userRepository.findById(id);
		if (!user) {
			throw this.userNotFoundError(id);
		}

		return this.toSafeUserDto(user);
	}

	async getUserProfileById(
		id: string,
		authUser: JWTPayload,
	): Promise<ProfileDto> {
		const profile = await this.userRepository.findById(id);

		if (!profile) {
			throw this.userNotFoundError(id);
		}

		if (authUser.role === ROLE_VALUES[1]) return this.toSafeUserDto(profile);

		if (authUser.role === ROLE_VALUES[0]) {
			if (profile.id !== authUser.sub) {
				throw this.accessDeniedError();
			}
			return this.toSafeUserDto(profile);
		}

		if (authUser.role === ROLE_VALUES[2]) {
			if (profile.id === authUser.sub) {
				return this.toSafeUserDto(profile);
			}
			return this.toSupportUserDto(profile);
		}

		throw this.accessDeniedError();
	}

	async updateUser(
		id: string,
		data: UpdateUserDto,
		authUser: JWTPayload,
	): Promise<SafeUserDto> {
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}

		const isOwner = existingUser.id === authUser.sub;
		const isPrivilegedRole =
			authUser.role === 'ADMIN' || authUser.role === 'SUPPORT';

		if (!isOwner && !isPrivilegedRole) {
			throw this.accessDeniedError();
		}

		if (authUser.role === 'SUPPORT' && !isOwner) {
			if (data.email || data.password) {
				throw this.supportRestrictedFieldError();
			}
		}

		const { password } = data;

		const updateData: UpdateUserData = {
			...data,
			password: password ? await bcrypt.hash(password, 10) : undefined,
		};

		const updatedUser = await this.userRepository.update(id, updateData);

		return this.toSafeUserDto(updatedUser);
	}

	async updateUserRole(
		id: string,
		authUser: JWTPayload,
		role: Role,
	): Promise<SafeUserDto> {
		if (authUser.role !== 'ADMIN') {
			throw this.accessDeniedError();
		}

		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}

		const updatedUser = await this.userRepository.updateRole(id, { role });

		return this.toSafeUserDto(updatedUser);
	}

	//TODO: add authorization for admin
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
	private toSafeUserDto(user: UserDomain): SafeUserDto {
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

	private toSupportUserDto(user: UserDomain): SupportUserDto {
		return supportUserSchema.parse({
			id: user.id,
			primaryCurrencyCode: user.primaryCurrencyCode,
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
				detail: `No user found with ID ${id}.`,
			},
		});
	}

	private accessDeniedError() {
		return forbiddenError({
			detail: 'You do not have permission to access this resource.',
		});
	}

	private supportRestrictedFieldError() {
		return forbiddenError({
			detail: "SUPPORT cannot update another user's email or password.",
		});
	}
}
