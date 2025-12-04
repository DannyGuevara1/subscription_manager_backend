// src/modules/user/user.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type { UserService } from '@/modules/user/index.js';

interface userParams {
	id: string;
}

export default class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	async getAllUsers(_req: Request, res: Response, _next: NextFunction) {
		res.status(200).json({
			status: 'success',
			data: await this.userService.getAllUsers(),
		});
	}

	async getUserById(
		req: Request<userParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const user = await this.userService.getUserById(id);

		res.status(200).json(user);
	}

	async createUser(req: Request, res: Response, _next: NextFunction) {
		const userData = req.body;
		const newUser = await this.userService.createUser(userData);

		res.status(201).json({
			status: 'success',
			data: newUser,
		});
	}

	async updateUser(
		req: Request<userParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const userData = req.body;
		const updatedUser = await this.userService.updateUser(id, userData);

		res.status(200).json({
			status: 'success',
			data: updatedUser,
		});
	}

	async deleteUser(
		req: Request<userParams>,
		res: Response,
		_next: NextFunction,
	) {
		const { id } = req.params;
		const deletedUser = await this.userService.deleteUser(id);

		res.status(200).json({
			status: 'success',
			data: deletedUser,
		});
	}
}
