import assert from 'node:assert/strict';
import { it } from 'node:test';
import { expensesByCategoryQueryParamsSchema } from '@/modules/analytics/analytics.dto.js';

it('maps legacy boolean filters to the domain status while accepting explicit statuses', () => {
	for (const [input, expected] of [
		['true', 'ACTIVE'],
		['false', 'PAUSED'],
		['ACTIVE', 'ACTIVE'],
		['PAUSED', 'PAUSED'],
		['CANCELLED', 'CANCELLED'],
	]) {
		assert.equal(
			expensesByCategoryQueryParamsSchema.parse({ status: input }).status,
			expected,
		);
	}
	assert.equal(
		expensesByCategoryQueryParamsSchema.safeParse({ status: 'unknown' })
			.success,
		false,
	);
});
