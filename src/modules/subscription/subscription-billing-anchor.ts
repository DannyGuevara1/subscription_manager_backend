import type { SubscriptionDomain } from './subscription.type.js';

/**
 * Computes the effective billing anchor date for projection and billing cycle logic.
 * If resumedAt is set and the subscription is currently active, resumedAt defines
 * the start of the active paid period for projection purposes. Otherwise (if resumedAt
 * is null or subscription is not active), firstPaymentDate is used.
 *
 * This function is kept internal to subscription domain logic; clients that want to
 * project payments relative to the billing anchor should compute it once per
 * subscription and pass it into projection helpers, or call this function when
 * iterating/processing multiple subscriptions.
 *
 * @param subscription subscription domain object
 * @returns effective billing anchor date for projection (resumedAt or firstPaymentDate)
 */
export function getBillingAnchor(
	subscription: Pick<
		SubscriptionDomain,
		'firstPaymentDate' | 'resumedAt' | 'status'
	>,
): Date {
	const { firstPaymentDate, resumedAt, status } = subscription;
	return resumedAt && status === 'ACTIVE' ? resumedAt : firstPaymentDate;
}
