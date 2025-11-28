// src/api/features/auth/controllers/auth.controller.ts
import type { NextFunction, Request, Response } from 'express';
import type AuthService from '@/api/features/auth/services/auth.service.js';

export default class AuthController {
	private authService: AuthService;
	constructor(authService: AuthService) {
		this.authService = authService;
	}

	async login(req: Request, res: Response, _next: NextFunction) {
		const { email, password } = req.body;
		const { user, accessToken } = await this.authService.authenticate(
			email,
			password,
		);
		res
			.cookie('accessToken', accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 1000 * 60 * 60, // 1 hour
			})
			.status(200)
			.json({
				message: 'Login successful',
				user,
			});
	}

	async logout(_req: Request, res: Response, _next: NextFunction) {
		res
			.clearCookie('accessToken', {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
			})
			.status(200)
			.json({
				message: 'Logout successful',
			});
	}
}
