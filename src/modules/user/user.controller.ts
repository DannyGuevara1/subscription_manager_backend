// src/modules/user/user.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { UserParams, UserService } from '@/modules/user/index.js';
import type { Role } from '@/shared/types/domain.enums.js';

export default class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
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
		const requesterUserId = req.user?.sub;
		const requesterRole = req.user?.role as Role | undefined;
		const user = await this.userService.getUserById(
			id,
			requesterUserId,
			requesterRole,
		);

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
		const sub = req.user?.sub as string;

		const updatedUser = await this.userService.updateUser(id, userData, sub);

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
