// src/api/features/auth/controllers/auth.controller.ts
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthService, RegisterService } from '@/modules/auth/index.js';
import { parseMs } from '@/shared/utils/parse-ms.util.js';

// Definimos las opciones base fuera de la clase para asegurar consistencia
// Esto evita bugs donde el logout no borra la cookie por diferencias en la config.
const AUTH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
};

const ACCESS_COOKIE_MAX_AGE = parseMs(
	process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '5m',
);
const REFRESH_COOKIE_MAX_AGE = parseMs(
	process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '7d',
);

export default class AuthController {
	private authService: AuthService;
	private registerService: RegisterService;
	constructor(authService: AuthService, registerService: RegisterService) {
		this.authService = authService;
		this.registerService = registerService;
	}

	async login(req: Request, res: Response, _next: NextFunction) {
		const data = req.body;
		const { user, accessToken, refreshToken } =
			await this.authService.authenticate(data);
		res
			.cookie('ACCESS_TOKEN', accessToken, {
				...AUTH_COOKIE_OPTIONS,
				maxAge: ACCESS_COOKIE_MAX_AGE,
			})
			.cookie('REFRESH_TOKEN', refreshToken, {
				...AUTH_COOKIE_OPTIONS,
				maxAge: REFRESH_COOKIE_MAX_AGE,
			})
			.status(200)
			.json({
				data: user,
			});
	}

	async logout(req: Request, res: Response, _next: NextFunction) {
		let userId = req.user?.sub as string;

		if (!userId && req.cookies.REFRESH_TOKEN) {
			const decode = jwt.decode(req.cookies.REFRESH_TOKEN) as { sub: string };
			if (decode?.sub) userId = decode.sub;
		}

		if (userId) await this.authService.invalidateRefreshToken(userId);

		res
			.clearCookie('ACCESS_TOKEN', {
				...AUTH_COOKIE_OPTIONS,
				maxAge: 0,
			})
			.clearCookie('REFRESH_TOKEN', {
				...AUTH_COOKIE_OPTIONS,
				maxAge: 0,
			})
			.status(200)
			.json({
				message: 'Logout successful',
			});
	}

	async refreshToken(req: Request, res: Response, _next: NextFunction) {
		const refreshToken = req.cookies.REFRESH_TOKEN;
		const {
			user,
			accessToken,
			refreshToken: newRefreshToken,
		} = await this.authService.refreshSession(refreshToken);

		res
			.cookie('ACCESS_TOKEN', accessToken, {
				...AUTH_COOKIE_OPTIONS,
				maxAge: ACCESS_COOKIE_MAX_AGE,
			})
			.cookie('REFRESH_TOKEN', newRefreshToken, {
				...AUTH_COOKIE_OPTIONS,
				maxAge: REFRESH_COOKIE_MAX_AGE,
			})
			.status(200)
			.json({
				data: user,
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
