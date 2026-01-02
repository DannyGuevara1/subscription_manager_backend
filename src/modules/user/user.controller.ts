// src/modules/user/user.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { UserParams, UserService } from '@/modules/user/index.js';

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
		const user = await this.userService.getUserById(id);

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
		const updatedUser = await this.userService.updateUser(id, userData);

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
		const deletedUser = await this.userService.deleteUser(id);

		res.status(200).json({
			data: deletedUser,
		});
	}
}
