import type { RequestHandler } from 'express';

export function readinessHandler(
	checks: (() => Promise<unknown>)[],
	timeoutMs = 1500,
): RequestHandler {
	// Share a pending probe so outages cannot build an unbounded queue of DB work.
	let pending: Promise<unknown> | undefined;
	return async (_req, res) => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			pending ??= Promise.allSettled(
				checks.map((check) => Promise.resolve().then(check)),
			)
				.then((results) => {
					if (results.some((result) => result.status === 'rejected'))
						throw new Error('Dependency unavailable');
				})
				.finally(() => {
					pending = undefined;
				});
			await Promise.race([
				pending,
				new Promise((_, reject) => {
					timer = setTimeout(
						() => reject(new Error('Readiness timeout')),
						timeoutMs,
					);
				}),
			]);
			res.status(200).json({ status: 'ready' });
		} catch {
			res.status(503).type('application/problem+json').json({
				type: '/problems/service-unavailable',
				title: 'Service Unavailable',
				status: 503,
				detail: 'Required dependencies are unavailable.',
			});
		} finally {
			clearTimeout(timer);
		}
	};
}
