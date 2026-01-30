import express from 'express';
import type AuthController from '@/modules/auth/auth.controller.js';
import * as authDto from '@/modules/auth/auth.dto.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { catchAsync } from '@/shared/utils/catch.async.js';

export const path = '/auth';

export default function authRoutes(authController: AuthController) {
	const authRouter = express.Router();

	authRouter.post(
		'/login',
		validateRequest(authDto.loginRequestSchema),
		catchAsync(authController.login.bind(authController)),
	);

	authRouter.post(
		'/logout',
		catchAsync(authController.logout.bind(authController)),
	);

	authRouter.post(
		'/register',
		validateRequest(authDto.registerRequestSchema),
		catchAsync(authController.register.bind(authController)),
	);

	authRouter.post(
		'/refresh-token',
		catchAsync(authController.refreshToken.bind(authController)),
	);

	return authRouter;
}
