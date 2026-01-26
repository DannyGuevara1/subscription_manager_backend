// src/modules/auth/auth.service.ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type redis from 'redis';
import type {
	AuthLoginResponse,
	AuthUser,
	JWTPayload,
	RefreshTokenPayload,
} from '@/modules/auth/auth.type.js';
import type { LoginDto } from '@/modules/auth/index.js';
import type LoginService from '@/modules/auth/login.service.js';

export default class AuthService {
	private loginService: LoginService;
	private redis: redis.RedisClientType;
	constructor(loginService: LoginService, redis: redis.RedisClientType) {
		this.loginService = loginService;
		this.redis = redis;
	}

	async authenticate(data: LoginDto): Promise<AuthLoginResponse> {
		// Implementation of authentication logic
		const credentials = await this.loginService.login(data);
		const accessToken = this.generateAccessToken(credentials);
		const refreshToken = this.generateRefreshToken(credentials);

		await this.redis.set(`refreshToken:${credentials.id}`, refreshToken, {
			EX: 7 * 24 * 60 * 60, // Expira en 7 días
		});

		return {
			accessToken: accessToken,
			refreshToken: refreshToken,
			user: credentials,
		};
	}

	generateAccessToken(user: AuthUser): string {
		const SECRET = process.env.JWT_SECRET;
		const EXPIRESIN = (process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ??
			'5m') as StringValue;

		const payload: JWTPayload = {
			sub: user.id, // Subject (user ID)
			email: user.email,
			name: user.name,
			primaryCurrencyCode: user.primaryCurrencyCode,
		};

		const signOptions: SignOptions = {
			expiresIn: EXPIRESIN,
		};

		return jwt.sign(payload, SECRET as string, signOptions);
	}

	generateRefreshToken(user: AuthUser): string {
		const SECRET = process.env.JWT_SECRET;
		const EXPIRESIN = (process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ??
			'7d') as StringValue;

		const payload: RefreshTokenPayload = {
			sub: user.id, // Subject (user ID)
			jti: user.id, // JWT ID para identificar el token de refresco
		};

		const signOptions: SignOptions = {
			expiresIn: EXPIRESIN,
		};

		return jwt.sign(payload, SECRET as string, signOptions);
	}
}
