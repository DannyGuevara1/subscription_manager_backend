import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
		detail: 'You have exceeded the request limit. Please try again later.',
	},
});

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
		detail: 'Too many authentication attempts. Please try again later.',
	},
});

/**
 * Stricter rate limiter for compute-heavy endpoints (dashboard, analytics).
 *
 * These endpoints trigger multiple DB queries, exchange rate lookups,
 * and cost normalization calculations per request. A lower limit
 * protects the server from excessive load while still allowing
 * normal usage patterns (e.g., a refresh every ~30 seconds).
 *
 * 30 requests per 15-minute window ≈ 1 request every 30 seconds.
 */
export const heavyQueryLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 30,
	standardHeaders: 'draft-7',
	legacyHeaders: false,
	message: {
		type: '/problems/rate-limit-exceeded',
		title: 'Rate Limit Exceeded',
		status: 429,
		detail:
			'Too many requests to analytics/dashboard endpoints. Please try again later.',
	},
});
