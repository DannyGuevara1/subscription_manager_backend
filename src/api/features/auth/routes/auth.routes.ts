import express from 'express';
import type AuthController from '@/api/features/auth/controllers/auth.controller.js';
import { catchAsync } from '@/utils/catch.async.js';

export const path = '/auth';

export default function authRoutes(authController: AuthController) {
	const authRouter = express.Router();

	authRouter.post(
		'/login',
		catchAsync(authController.login.bind(authController)),
	);

	authRouter.post(
		'/logout',
		catchAsync(authController.logout.bind(authController)),
	);

	return authRouter;
}
