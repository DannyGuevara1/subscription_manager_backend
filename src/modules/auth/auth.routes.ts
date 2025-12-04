import express from 'express';
import type AuthController from '@/modules/auth/auth.controller.js';
import { catchAsync } from '@/shared/utils/catch.async.js';
import { validateRequest } from '@/shared/middleware/validate.request.js';
import { loginSchema } from '@/modules/auth/auth.dto.js';

export const path = '/auth';

export default function authRoutes(authController: AuthController) {
	const authRouter = express.Router();

	authRouter.post(
		'/login',
		validateRequest(loginSchema),
		catchAsync(authController.login.bind(authController)),
	);

	authRouter.post(
		'/logout',
		catchAsync(authController.logout.bind(authController)),
	);

	return authRouter;
}
