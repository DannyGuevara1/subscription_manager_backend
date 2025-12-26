// src/modules/auth/services/register.service.ts
import {
	type RegisterDto,
	type SafeUserAuthDto,
	safeUserAuthDto,
} from '@/modules/auth/index.js';
import type { UserService } from '@/modules/user/index.js';
//import { ErrorFactory } from '@/shared/errors/error.factory.js';

export default class RegisterService {
	private readonly userService: UserService;
	private readonly DEFAULT_CURRENCY_CODE = 'USD';

	constructor(userService: UserService) {
		this.userService = userService;
	}

	async register(data: RegisterDto): Promise<SafeUserAuthDto> {
		const { email, password, name, primaryCurrencyCode } = data;
		const newUser = {
			email,
			password,
			name,
			primaryCurrencyCode: primaryCurrencyCode || this.DEFAULT_CURRENCY_CODE,
		};

		const user = await this.userService.createUser(newUser);

		return safeUserAuthDto.parse(user);
	}
}
