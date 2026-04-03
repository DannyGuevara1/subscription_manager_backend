// src/modules/user/user.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '@/modules/auth/index.js';
import {
	type CreateUserDto,
	safeUserSchema,
	supportUserSchema,
	type UpdateUserDto,
	type UpdateUserRoleDto,
	type UserOffsetPaginationQueryDto,
	type UserParamsDto,
} from '@/modules/user/user.dto.js';
import type UserService from '@/modules/user/user.service.js';
import type { ProfileDomain } from '@/modules/user/user.type.js';

export default class UserController {
	private userService: UserService;
	private authService: AuthService;

	constructor(userService: UserService, authService: AuthService) {
		this.userService = userService;
		this.authService = authService;
	}

	async getAllUsers(req: Request, res: Response, _next: NextFunction) {
		const { page, limit } = req.validated.query as UserOffsetPaginationQueryDto;
		const { users, meta } = await this.userService.getAllUsers({
			page,
			limit,
		});
		const serializedUsers = users.map((user) => safeUserSchema.parse(user));

		res.status(200).json({
			data: {
				users: serializedUsers,
			},
			meta,
		});
	}

	async getUserById(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as UserParamsDto;
		const authUser = req.user as NonNullable<Request['user']>;
		const user = await this.userService.getUserProfileById(id, authUser);

		res.status(200).json({
			data: this.serializeProfile(user),
		});
	}

	async createUser(req: Request, res: Response, _next: NextFunction) {
		const userData = req.validated.body as CreateUserDto;
		const newUser = await this.userService.createUser(userData);

		res.status(201).json({
			data: safeUserSchema.parse(newUser),
		});
	}

	async updateUser(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as UserParamsDto;
		const userData = req.validated.body as UpdateUserDto;
		const authUser = req.user as NonNullable<Request['user']>;

		const updatedUser = await this.userService.updateUser(
			id,
			userData,
			authUser,
		);

		res.status(200).json({
			data: this.serializeProfile(updatedUser),
		});
	}

	async updateUserRole(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as UserParamsDto;
		const { role } = req.validated.body as UpdateUserRoleDto;
		const authUser = req.user as NonNullable<Request['user']>;

		const updatedUser = await this.userService.updateUserRole(
			id,
			authUser,
			role,
		);

		await this.authService.invalidateRefreshToken(id);

		res.status(200).json({
			data: safeUserSchema.parse(updatedUser),
		});
	}

	async deleteUser(req: Request, res: Response, _next: NextFunction) {
		const { id } = req.validated.params as UserParamsDto;
		const sub = req.user?.sub as string;
		await this.userService.deleteUser(id, sub);

		res.status(204).send();
	}

	private serializeProfile(profile: ProfileDomain) {
		if ('email' in profile) {
			return safeUserSchema.parse(profile);
		}

		return supportUserSchema.parse(profile);
	}
}
