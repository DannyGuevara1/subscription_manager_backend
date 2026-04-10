import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createError } from '@/shared/errors/error.factory.js';

describe('Error Factory', () => {
	it('createError retorna tipo/status correctos para cada key principal.', () => {
		const error = createError('RESOURCE_NOT_FOUND', {
			detail: 'The requested resource was not found.',
			instance: '/api/resource/123',
			extensions: { resourceId: 123 },
		});

		assert.strictEqual(error.type, '/problems/resource-not-found');
		assert.strictEqual(error.status, 404);
	});
	it('createError lanza TypeError con typeKey invalido.', () => {
		assert.throws(
			() => {
				createError('INVALID_KEY' as any, {
					detail: 'This should fail.',
				});
			},
			(error: unknown) => {
				assert.ok(error instanceof TypeError);
				assert.match(
					error.message,
					/Problem type "INVALID_KEY" does not exist in ProblemTypes\./,
				);

				return true;
			},
		);
	});
});
