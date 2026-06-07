# Tasks: API Roadmap for Dashboard and Analytics

## Phase 1: Foundation / Data Contracts
- [✅] 1.1 Update `prisma/schema.prisma` to add `exchangeRateToUSD` and `rateUpdatedAt` on `Currency` and create the Prisma migration.
- [✅] 1.2 Extend `src/modules/currency/currency.type.ts` and `src/modules/currency/currency.repository.ts` mapping to include `exchangeRateToUSD` and `rateUpdatedAt`.
- [✅] 1.3 Define request/response DTOs for new endpoints in `src/modules/dashboard/dashboard.dto.ts` and create `src/modules/analytics/analytics.dto.ts`.
- [✅] 1.4 Add domain types for analytics payloads in `src/modules/analytics/analytics.type.ts` (expenses by category, payment history entries).
- [✅] 1.5 Extend `src/modules/subscription/subscription.dto.ts` to accept `category` and `billingCycle` query filters in `subscriptionCursorPaginationQuerySchema`.

## Phase 2: Core Implementation
- [✅] 2.1 Create `src/modules/subscription/subscription-calculator.service.ts` to compute next payment dates and projections using `firstPaymentDate`, `billingFrequency`, and `billingUnit` (trial-aware).
- [✅] 2.2 Implement `src/modules/currency/exchange-rate.service.ts` to serve cached rates from `Currency` and trigger stale-while-revalidate updates when `rateUpdatedAt` > 24h (uses external provider).
- [ ] 2.3 Build `src/modules/analytics/analytics.service.ts` for `expenses-by-category` (normalize via exchange rates) and `payment-history` (use calculator, chronological ordering).
- [ ] 2.4 Extend `src/modules/dashboard/dashboard.service.ts` with `getUpcomingRenewals` (limit 5, trials first) and `getPaymentAlerts` (due within 7 days).
- [ ] 2.5 Update `src/modules/subscription/subscription.service.ts` and `src/modules/subscription/subscription.repository.ts` to apply `category` + `billingCycle` filters in `findAllWithCursor`.

## Phase 3: Integration / Wiring
- [ ] 3.1 Add `src/modules/analytics/analytics.controller.ts` and `src/modules/analytics/analytics.routes.ts` with auth + validation.
- [ ] 3.2 Update `src/modules/dashboard/dashboard.controller.ts` and `src/modules/dashboard/dashboard.routes.ts` to expose `/upcoming-renewals` and `/alerts`.
- [ ] 3.3 Register analytics routes in `src/routes/index.ts` (`/api/v1/analytics`).
- [ ] 3.4 Update `src/shared/container/container.types.ts` and module barrel exports (`src/modules/analytics/index.ts`, `src/modules/dashboard/index.ts` if needed) for new services/controllers/routes.

## Phase 4: Testing / Verification
- [✅] 4.1 Unit: add `tests/unit/subscription/subscription-calculator.service.test.ts` for leap year, month-end, trial edge cases.
- [✅] 4.2 Unit: add `tests/unit/currency/exchange-rate.service.test.ts` covering stale rate usage + async refresh trigger.
- [ ] 4.3 Unit: add `tests/unit/analytics/analytics.service.test.ts` for currency normalization and payment-history ordering.
- [ ] 4.4 Integration: add `tests/integration/dashboard/dashboard.test.ts` for upcoming renewals + alerts scenarios.
- [ ] 4.5 Integration: add `tests/integration/analytics/analytics.test.ts` for expenses-by-category + payment-history scenarios.
- [ ] 4.6 Integration: extend `tests/integration/subscription/subscription.test.ts` to validate `category` and `billingCycle` filters.

## Phase 5: Cleanup / Docs
- [ ] 5.1 Update any inline API docs/comments for new endpoints in `src/modules/dashboard/*` and `src/modules/analytics/*`.
