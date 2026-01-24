// src/api/features/auth/controllers/auth.controller.ts
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import type { AuthService, RegisterService } from '@/modules/auth/index.js';

// Definimos las opciones base fuera de la clase para asegurar consistencia
// Esto evita bugs donde el logout no borra la cookie por diferencias en la config.
const AUTH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
};

export default class AuthController {
	private authService: AuthService;
	private registerService: RegisterService;
	constructor(authService: AuthService, registerService: RegisterService) {
		this.authService = authService;
		this.registerService = registerService;
	}

	async login(req: Request, res: Response, _next: NextFunction) {
		const data = req.body;
		const { user, accessToken } = await this.authService.authenticate(data);
		res
			.cookie('ACCESS_TOKEN', accessToken, {
				...AUTH_COOKIE_OPTIONS,
				maxAge: 1000 * 60 * 60, // 1 hour
			})
			.status(200)
			.json({
				data: user,
			});
	}

	async logout(_req: Request, res: Response, _next: NextFunction) {
		res
			.clearCookie('ACCESS_TOKEN', {
				...AUTH_COOKIE_OPTIONS,
				maxAge: 0,
			})
			.status(200)
			.json({
				message: 'Logout successful',
			});
	}

	async register(req: Request, res: Response, _next: NextFunction) {
		const data = req.body;
		const user = await this.registerService.register(data);
		res.status(201).json({
			data: {
				...user,
			},
		});
	}
}
