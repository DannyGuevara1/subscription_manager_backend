# Proposal: API Roadmap for Dashboard and Analytics

## Intent
Implement the dashboard endpoints, analytics reporting, and infrastructure (currency rate caching) required to give users a comprehensive view of their recurring expenses and upcoming payments, fulfilling requirements RF-B, RF-D, and RNF-03.

## Scope

### In Scope
- **Dashboard Endpoints:**
  - `GET /api/v1/dashboard/upcoming-renewals`: Returns 3-5 closest renewals, prioritizing trial ends.
  - `GET /api/v1/dashboard/alerts`: Returns payments due within the next 7 days.
- **Reports & Analytics:**
  - `GET /api/v1/analytics/expenses-by-category`: Expense breakdown by category, normalized to the user's primary currency.
  - Update `GET /api/v1/subscriptions` to support `category` and `billingCycle` filters.
  - `GET /api/v1/analytics/payment-history`: Projects past and future payments based on `firstPaymentDate` and billing cycles.
- **Infrastructure:**
  - Add `exchangeRateToUSD` and `rateUpdatedAt` to the `Currency` Prisma model.
  - Create an `ExchangeRateService` to cache and fetch rates every 24h via a stale-while-revalidate pattern.

### Out of Scope
- Frontend UI implementation.
- Email or Push notifications for alerts (only API endpoints are in scope).
- Live fetching of exchange rates on every request.

## Capabilities

### New Capabilities
- `dashboard-api`: Endpoints for upcoming renewals and payment alerts.
- `analytics-api`: Endpoints for expense breakdown and payment history projection.
- `exchange-rate-cache`: Infrastructure for 24h currency caching.

### Modified Capabilities
- `subscription-crud`: Modify listing to support new query filters (category, billingCycle).

## Approach
- **Calculations**: Implement a domain service `SubscriptionCalculator` to compute next payment dates using `firstPaymentDate`, `billingFrequency`, and `billingUnit`. Shared between dashboard alerts, upcoming renewals, and payment history.
- **Currency Caching**: Extend the `Currency` model. `ExchangeRateService` checks if rates are > 24h old; if so, it updates them asynchronously (stale-while-revalidate).
- **DI & Structure**: Register new controllers, routes, and services via Awilix, following the existing hexagonal/clean architecture patterns.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `exchangeRateToUSD` & `rateUpdatedAt` to `Currency` |
| `src/routes/` | New | Add `dashboard.routes.ts`, `analytics.routes.ts` |
| `src/controllers/` | New | Add `DashboardController`, `AnalyticsController` |
| `src/services/` | New | Add `DashboardService`, `AnalyticsService`, `ExchangeRateService`, `SubscriptionCalculator` |
| `src/controllers/subscription.controller.ts` | Modified | Update `index` to parse query filters |
| `src/services/subscription.service.ts` | Modified | Update `findAll` to apply Prisma filters |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inaccurate payment projections | Medium | Comprehensive unit tests for `SubscriptionCalculator` with edge cases (leap years, month-end). |
| Exchange rate API limits | Low | 24-hour cache and stale-while-revalidate approach avoids rate limits. |

## Rollback Plan
- Revert the `schema.prisma` changes via Prisma migration rollback.
- Remove the new routes from the Express router setup.
- Revert the filter additions in `subscription.controller.ts` and `subscription.service.ts`.

## Dependencies
- External API for Exchange Rates (e.g., ExchangeRate-API or OpenExchangeRates), or a mock implementation initially.

## Success Criteria
- [ ] `GET /dashboard/upcoming-renewals` correctly prioritizes trial end dates.
- [ ] `GET /analytics/expenses-by-category` accurately normalizes costs into the user's primary currency using cached rates.
- [ ] Exchange rates update automatically if older than 24 hours without blocking the API response.
- [ ] 100% test coverage on `SubscriptionCalculator` logic.
