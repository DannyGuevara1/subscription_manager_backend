import assert from 'node:assert';
import { describe, it } from 'node:test';
import CategoryService from '@/modules/category/category.service.js';

const OWNER_ID = '0197f644-3f67-7f07-9537-6cc9db95f111';
const OTHER_USER_ID = '0197f644-3f67-7f07-9537-6cc9db95f222';

const BASE_CATEGORY = {
	id: 42,
	userId: OWNER_ID,
	name: 'Streaming',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createFixture = () => {
	const calls = {
		findById: [] as number[],
		findByNameAndUserId: [] as Array<{ name: string; userId: string }>,
		update: [] as Array<{ id: number; data: unknown }>,
		delete: [] as number[],
	};

	const categoryRepository = {
		findById: async (id: number) => {
			calls.findById.push(id);
			return BASE_CATEGORY;
		},
		findByNameAndUserId: async (name: string, userId: string) => {
			calls.findByNameAndUserId.push({ name, userId });
			return null;
		},
		update: async (id: number, data: Record<string, unknown>) => {
			calls.update.push({ id, data });
			return {
				...BASE_CATEGORY,
				...data,
			};
		},
		delete: async (id: number) => {
			calls.delete.push(id);
			return BASE_CATEGORY;
		},
	} as any;

	const service = new CategoryService(categoryRepository);

	return { service, categoryRepository, calls };
};

describe('Category Service', () => {
	it('valida ownership en updateCategory.', async () => {
		const fixture = createFixture();

		fixture.categoryRepository.findById = async (id: number) => {
			fixture.calls.findById.push(id);
			return {
				...BASE_CATEGORY,
				id,
				userId: OTHER_USER_ID,
			};
		};

		await assert.rejects(
			() => fixture.service.updateCategory(42, { name: 'Utilities' }, OWNER_ID),
			(error: unknown) => {
				assert.strictEqual((error as { status?: number }).status, 403);
				return true;
			},
		);

		assert.deepStrictEqual(
			fixture.calls.findByNameAndUserId,
			[],
			'Name conflict check should not run when ownership validation fails first',
		);
		assert.deepStrictEqual(fixture.calls.update, []);
	});

	it('valida ownership en deleteCategory.', async () => {
		const fixture = createFixture();

		fixture.categoryRepository.findById = async (id: number) => {
			fixture.calls.findById.push(id);
			return {
				...BASE_CATEGORY,
				id,
				userId: OTHER_USER_ID,
			};
		};

		await assert.rejects(
			() => fixture.service.deleteCategory(42, OWNER_ID),
			(error: unknown) => {
				assert.strictEqual((error as { status?: number }).status, 403);
				return true;
			},
		);

		assert.deepStrictEqual(fixture.calls.delete, []);
	});
});
