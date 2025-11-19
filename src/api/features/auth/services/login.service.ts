// src/api/features/auth/services/login.service.ts
import bcrypt from 'bcrypt';
import {
	loginSchema,
	type SafeLoginDto,
	safeLoginDto,
} from '@/api/features/auth/dto/auth.dto.js';
import { ErrorFactory } from '@/errors/error.factory.js';
import type UserRepository from '@/repositories/user/user.repository.js';
export default class LoginService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async login(email: string, password: string): Promise<SafeLoginDto> {
		// Validate input data
		const validatedData = loginSchema.parse({ email, password });

		// Check if user exists
		const user = await this.userRepository.findByEmail(validatedData.email);

		if (!user) {
			throw ErrorFactory.notFoundError({
				resource: 'User',
				identifier: validatedData.email,
				extensions: {
					detail: `No se encontró ningún usuario con el correo ${validatedData.email}.`,
				},
			});
		}
		// Check password
		const isPasswordValid = await bcrypt.compare(
			validatedData.password,
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
