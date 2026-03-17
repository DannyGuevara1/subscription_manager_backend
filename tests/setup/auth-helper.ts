import type { Express } from 'express';
import request from 'supertest';
import type { RegisterDto, SafeUserAuthDto } from '@/modules/auth/index.js';

type AuthResponse = {
	cookie: string;
	user: SafeUserAuthDto;
};

export async function loginAsUser(
	app: Express,
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

	const cookie = cookies.map((c: string) => c.split(';')[0]).join('; ');

	const user = loginResponse.body.data;

	return { cookie, user };
}

export async function loginAsAdmin(app: Express): Promise<AuthResponse> {
	const loginResponse = await request(app)
		.post('/api/v1/auth/login')
		.set('Origin', 'http://localhost:3000')
		.send({
			email: 'guevarad170@gmail.com',
			password: 'admin123',
		});

	if (loginResponse.status !== 200) {
		throw new Error(
			`Admin login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`,
		);
	}

	const cookies = loginResponse.headers['set-cookie'];

	if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
		throw new Error('Failed to retrieve authentication cookie');
	}

	const cookie = cookies.map((c: string) => c.split(';')[0]).join('; ');
	const user = loginResponse.body.data;

	return { cookie, user };
}

export async function loginAsSupport(app: Express): Promise<AuthResponse> {
	const loginResponse = await request(app)
		.post('/api/v1/auth/login')
		.set('Origin', 'http://localhost:3000')
		.send({
			email: 'support@subscriptionmanager.com',
			password: 'support123',
		});

	if (loginResponse.status !== 200) {
		throw new Error(
			`Support login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`,
		);
	}

	const cookies = loginResponse.headers['set-cookie'];

	if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
		throw new Error('Failed to retrieve authentication cookie');
	}

	const cookie = cookies.map((c: string) => c.split(';')[0]).join('; ');
	const user = loginResponse.body.data;

	return { cookie, user };
}
