import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { JWTPayload } from '@/modules/auth/auth.type.js';
import UserService from '@/modules/user/user.service.js';

const USER_ID = '0197f644-3f67-7f07-9537-6cc9db95f111';
const OTHER_USER_ID = '0197f644-3f67-7f07-9537-6cc9db95f222';

const BASE_USER = {
	id: USER_ID,
	name: 'Unit User',
	email: 'unit@example.com',
	password: 'hashed-password',
	primaryCurrencyCode: 'USD',
	role: 'USER' as const,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createFixture = () => {
	const calls = {
		findById: [] as string[],
	};

	const userRepository = {
		findById: async (id: string) => {
			calls.findById.push(id);
			return BASE_USER;
		},
	} as any;

	const service = new UserService(userRepository);

	return { service, userRepository, calls };
};

describe('User Service', () => {
	it('USER solo accede a su propio perfil.', async () => {
		const fixture = createFixture();

		fixture.userRepository.findById = async (id: string) => {
			fixture.calls.findById.push(id);
			return {
				...BASE_USER,
				id,
				email: id === USER_ID ? 'unit@example.com' : 'other@example.com',
			};
		};

		const authUser: JWTPayload = {
			sub: USER_ID,
			email: 'unit@example.com',
			name: 'Unit User',
			role: 'USER',
			primaryCurrencyCode: 'USD',
		};

		const ownProfile = await fixture.service.getUserProfileById(
			USER_ID,
			authUser,
		);

		assert.strictEqual(ownProfile.id, USER_ID);
		assert.strictEqual(
			(ownProfile as { email?: string }).email,
			'unit@example.com',
		);

		await assert.rejects(
			() => fixture.service.getUserProfileById(OTHER_USER_ID, authUser),
			(error: unknown) => {
				assert.strictEqual((error as { status?: number }).status, 403);
				return true;
			},
		);
	});

	it('SUPPORT recibe perfil restringido al consultar otro usuario.', async () => {
		const fixture = createFixture();

		fixture.userRepository.findById = async (id: string) => {
			fixture.calls.findById.push(id);
			return {
				...BASE_USER,
				id,
				email: 'other@example.com',
				name: 'Other User',
			};
		};

		const authSupport: JWTPayload = {
			sub: USER_ID,
			email: 'support@example.com',
			name: 'Support Agent',
			role: 'SUPPORT',
			primaryCurrencyCode: 'USD',
		};

		const profile = await fixture.service.getUserProfileById(
			OTHER_USER_ID,
			authSupport,
		);

		assert.deepStrictEqual(profile, {
			id: OTHER_USER_ID,
			primaryCurrencyCode: 'USD',
		});
	});
});
