// src/services/user.service.ts

import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import type { JWTPayload } from '@/modules/auth/index.js';
import type {
	CreateUserInput,
	CreateUserData,
	ProfileDomain,
	SupportUserRoleDomain,
	UpdateUserData,
	UserDomain,
	UserOffsetPaginationInput,
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

	async createUser(data: CreateUserInput): Promise<UserDomain> {
		const { email, password, name, primaryCurrencyCode } = data;

		const userData: CreateUserData = {
			id: uuidv7(),
			email: email,
			password: await bcrypt.hash(password, 10),
			name: name,
			primaryCurrencyCode: primaryCurrencyCode,
		};

		const newUser = await this.userRepository.create(userData);

		return newUser;
	}

	async getAllUsers({ page, limit }: UserOffsetPaginationInput): Promise<{
		users: UserDomain[];
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
			users,
			meta,
		};
	}

	async getUserByIdInternal(id: string): Promise<UserDomain> {
		const user = await this.userRepository.findById(id);
		if (!user) {
			throw this.userNotFoundError(id);
		}

		return user;
	}

	async getUserProfileById(
		id: string,
		authUser: JWTPayload,
	): Promise<ProfileDomain> {
		const profile = await this.userRepository.findById(id);

		if (!profile) {
			throw this.userNotFoundError(id);
		}

		if (authUser.role === ROLE_VALUES[1]) return profile;

		if (authUser.role === ROLE_VALUES[0]) {
			if (profile.id !== authUser.sub) {
				throw this.accessDeniedError();
			}
			return profile;
		}

		if (authUser.role === ROLE_VALUES[2]) {
			if (profile.id === authUser.sub) {
				return profile;
			}
			return this.toSupportUserDto(profile);
		}

		throw this.accessDeniedError();
	}

	async updateUser(
		id: string,
		data: UpdateUserData,
		authUser: JWTPayload,
	): Promise<ProfileDomain> {
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

		if (authUser.role === ROLE_VALUES[2] && !isOwner) {
			return this.toSupportUserDto(updatedUser);
		}

		return updatedUser;
	}

	async updateUserRole(
		id: string,
		authUser: JWTPayload,
		role: Role,
	): Promise<UserDomain> {
		if (authUser.role !== 'ADMIN') {
			throw this.accessDeniedError();
		}

		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}

		const updatedUser = await this.userRepository.updateRole(id, { role });

		return updatedUser;
	}

	//TODO: add authorization for admin
	async deleteUser(id: string, userId: string): Promise<UserDomain> {
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw this.userNotFoundError(id);
		}
		if (existingUser.id !== userId) {
			throw this.accessDeniedError();
		}
		await this.userRepository.delete(id);

		return existingUser;
	}

	private toSupportUserDto(user: UserDomain): SupportUserRoleDomain {
		return {
			id: user.id,
			primaryCurrencyCode: user.primaryCurrencyCode,
		};
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
