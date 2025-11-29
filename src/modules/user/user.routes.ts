// src/api/components/user/user.routes.ts
import express from 'express';
import type UserController from '@/modules/user/user.controller.js';
import { catchAsync } from '@/shared/utils/catch.async.js';

export const path = '/users';

export default function userRoutes(
	userController: UserController,
): express.Router {
	const router = express.Router();
	// User Router
	router.get('/', catchAsync(userController.getAllUsers.bind(userController)));

	router.get(
		'/:id',
		catchAsync(userController.getUserById.bind(userController)),
	);

	router.post('/', catchAsync(userController.createUser.bind(userController)));

	router.put(
		'/:id',
		catchAsync(userController.updateUser.bind(userController)),
	);

	router.delete(
		'/:id',
		catchAsync(userController.deleteUser.bind(userController)),
	);
	return router;
}
