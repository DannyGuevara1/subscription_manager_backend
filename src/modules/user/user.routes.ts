// src/modules/user/user.routes.ts
import express from 'express';
import * as userSchema from '@/modules/user/index.js';
import type UserController from '@/modules/user/user.controller.js';
import { authorize } from '@/shared/middleware/authorize.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';

export const path = '/users';

export default function userRoutes(
	userController: UserController,
): express.Router {
	const router = express.Router();
	// User Router
	router
		.route('/')
		.get(
			authorize('ADMIN'),
			catchAsync(userController.getAllUsers.bind(userController)),
		)
		.post(
			authorize('ADMIN'),
			validateRequest(userSchema.createUserRequestSchema),
			catchAsync(userController.createUser.bind(userController)),
		);

	router
		.route('/:id')
		.get(
			authorize('USER', 'ADMIN', 'SUPPORT'),
			validateRequest(userSchema.userParamsRequestSchema),
			catchAsync(userController.getUserById.bind(userController)),
		)
		.put(
			authorize('USER', 'ADMIN', 'SUPPORT'),
			validateRequest(userSchema.updateUserRequestSchema),
			catchAsync(userController.updateUser.bind(userController)),
		)
		.delete(
			authorize('USER', 'ADMIN', 'SUPPORT'),
			validateRequest(userSchema.userParamsRequestSchema),
			catchAsync(userController.deleteUser.bind(userController)),
		);

	router.patch(
		'/:id/role',
		authorize('ADMIN'),
		validateRequest(userSchema.updateUserRoleRequestSchema),
		catchAsync(userController.updateUserRole.bind(userController)),
	);
	return router;
}
