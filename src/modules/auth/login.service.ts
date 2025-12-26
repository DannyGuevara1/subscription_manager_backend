// src/modules/auth/login.service.ts
import bcrypt from 'bcrypt';
import type { LoginDto } from '@/modules/auth/index.js';
import { type SafeUserAuthDto, safeUserAuthDto } from '@/modules/auth/index.js';
import type UserRepository from '@/modules/user/user.repository.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';
export default class LoginService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async login({ email, password }: LoginDto): Promise<SafeUserAuthDto> {
		// Validate input data
		const user = await this.userRepository.findByEmail(email);

		if (!user) {
			throw ErrorFactory.unauthorizedError({
				detail:
					'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw ErrorFactory.unauthorizedError({
				detail:
					'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
			});
		}

		// Return safe user data
		return safeUserAuthDto.parse(user);
	}
}
