// src/modules/user/user.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '@/modules/auth/index.js';
import type {
	UpdateUserRoleDto,
	UserParams,
	UserService,
} from '@/modules/user/index.js';

export default class UserController {
	private userService: UserService;
	private authService: AuthService;

	constructor(userService: UserService, authService: AuthService) {
		this.userService = userService;
		this.authService = authService;
	}

	async getAllUsers(_req: Request, res: Response, _next: NextFunction) {
		const users = await this.userService.getAllUsers();
		res.status(200).json({
			data: {
				users,
			},
		});
	}

	async getUserById(
		req: Request<UserParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const authUser = req.user as NonNullable<Request['user']>;
		const user = await this.userService.getUserProfileById(id, authUser);

		res.status(200).json({
			data: user,
		});
	}

	async createUser(req: Request, res: Response, _next: NextFunction) {
		const userData = req.body;
		const newUser = await this.userService.createUser(userData);

		res.status(201).json({
			data: newUser,
		});
	}

	async updateUser(
		req: Request<UserParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const userData = req.body;
		const authUser = req.user as NonNullable<Request['user']>;

		const updatedUser = await this.userService.updateUser(
			id,
			userData,
			authUser,
		);

		res.status(200).json({
			data: updatedUser,
		});
	}

	async updateUserRole(
		req: Request<UserParams, unknown, UpdateUserRoleDto>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const { role } = req.body;
		const authUser = req.user as NonNullable<Request['user']>;

		const updatedUser = await this.userService.updateUserRole(
			id,
			authUser,
			role,
		);

		await this.authService.invalidateRefreshToken(id);

		res.status(200).json({
			data: updatedUser,
		});
	}

	async deleteUser(
		req: Request<UserParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const sub = req.user?.sub as string;
		await this.userService.deleteUser(id, sub);

		res.status(204).send();
	}
}
