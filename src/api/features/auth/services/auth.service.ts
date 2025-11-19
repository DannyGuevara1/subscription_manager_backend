// src/api/features/auth/services/auth.service.ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type LoginService from '@/api/features/auth/services/login.service.js';
import type {
	AuthLoginResponse,
	AuthUser,
	JWTPayload,
} from '@/api/features/auth/types/auth.types.js';

export default class AuthService {
	private loginService: LoginService;
	constructor(loginService: LoginService) {
		this.loginService = loginService;
	}

	async authenticate(
		email: string,
		password: string,
	): Promise<AuthLoginResponse> {
		// Implementation of authentication logic
		const credentials = await this.loginService.login(email, password);
		const accessToken = this.generateToken(credentials);

		return {
			accessToken: accessToken,
			user: credentials,
		};
	}

	generateToken(user: AuthUser): string {
		const SECRET = process.env.JWT_SECRET;
		const EXPIRESIN = (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue;

		const payload: JWTPayload = {
			sub: user.id, // Subject (user ID)
			email: user.email,
			name: user.name,
		};

		const signOptions: SignOptions = {
			expiresIn: EXPIRESIN,
		};

		return jwt.sign(payload, SECRET as string, signOptions);
	}
}
