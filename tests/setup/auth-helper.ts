import request from 'supertest';
import type { RegisterDto, SafeUserAuthDto } from '@/modules/auth/index.js';

type AuthResponse = {
	cookie: string;
	user: SafeUserAuthDto;
};

export async function loginAsUser(
	app: any,
	userData: RegisterDto,
): Promise<AuthResponse> {
	await request(app)
		.post('/api/v1/auth/register')
		.set('Origin', 'http://localhost:3000')
		.send(userData);

	const loginResponse = await request(app)
		.post('/api/v1/auth/login')
		.set('Origin', 'http://localhost:3000')
		.send({
			email: userData.email,
			password: userData.password,
		});

	if (loginResponse.status !== 200) {
		throw new Error(
			`Login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`,
		);
	}

	const cookies = loginResponse.headers['set-cookie'];

	if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
		throw new Error('Failed to retrieve authentication cookie');
	}

	const cookie = cookies[0].split(';')[0] as string; // Extract the cookie value ACCESS_TOKEN

	const user = loginResponse.body.data;

	return { cookie, user };
}
