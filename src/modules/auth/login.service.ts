// src/api/features/auth/services/login.service.ts
import bcrypt from 'bcrypt';
import {
	type SafeLoginDto,
	safeLoginDto,
} from '@/modules/auth/auth.dto.js';
import { ErrorFactory } from '@/shared/errors/error.factory.js';
import type UserRepository from '@/modules/user/user.repository.js';
export default class LoginService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async login(email: string, password: string): Promise<SafeLoginDto> {
		// Validate input data
		const user = await this.userRepository.findByEmail(email);

		if (!user) {
			throw ErrorFactory.unauthorizedError({
				detail:
					'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
			});
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(
			password,
			user.password,
		);
		if (!isPasswordValid) {
			throw ErrorFactory.unauthorizedError({
				detail:
					'Credenciales inválidas. Por favor, verifica tu correo y contraseña.',
			});
		}

		// Return safe user data
		return safeLoginDto.parse(user);
	}
}
