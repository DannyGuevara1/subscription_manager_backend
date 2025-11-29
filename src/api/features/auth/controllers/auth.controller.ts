// src/api/features/auth/controllers/auth.controller.ts
import type { NextFunction, Request, Response, CookieOptions } from 'express';
import type AuthService from '@/api/features/auth/services/auth.service.js';

// Definimos las opciones base fuera de la clase para asegurar consistencia
// Esto evita bugs donde el logout no borra la cookie por diferencias en la config.
const AUTH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
};

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
				...AUTH_COOKIE_OPTIONS,
				maxAge: 1000 * 60 * 60, // 1 hour
			})
			.status(200)
			.json({
				status: 'success',
				data: {
					user,
				},
			});
	}

	async logout(_req: Request, res: Response, _next: NextFunction) {
		res
			.clearCookie('accessToken', {
				...AUTH_COOKIE_OPTIONS,
				maxAge: 0
			})
			.status(200)
			.json({
				status: 'success',
				data: {
					message: 'Logout successful',
				},
			});
	}
}
