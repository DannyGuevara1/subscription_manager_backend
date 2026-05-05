# Delta Specifications: API Roadmap

## ADDED Requirements

### Requirement: Dashboard Endpoints
The system MUST expose endpoints to retrieve upcoming renewals and alerts for a user's subscriptions.

#### Scenario: Fetch upcoming renewals
- GIVEN an authenticated user with active subscriptions
- WHEN the user requests `GET /api/v1/dashboard/upcoming-renewals`
- THEN the system MUST return up to 5 closest upcoming renewals
- AND the system MUST prioritize subscriptions with ending trials over regular renewals.

#### Scenario: Fetch payment alerts
- GIVEN an authenticated user with payments approaching
- WHEN the user requests `GET /api/v1/dashboard/alerts`
- THEN the system MUST return a list of payments due within the next 7 days.

### Requirement: Analytics Endpoints
The system MUST expose analytics endpoints for aggregating expenses and projecting payment timelines.

#### Scenario: Fetch expenses by category
- GIVEN an authenticated user with subscriptions in multiple currencies
- WHEN the user requests `GET /api/v1/analytics/expenses-by-category`
- THEN the system MUST return a payload aggregating total expenses grouped by category
- AND the system MUST normalize all amounts into the user's primary currency using the `Currency.exchangeRateToUSD` field.

#### Scenario: Fetch payment history projection
- GIVEN an authenticated user with active subscriptions
- WHEN the user requests `GET /api/v1/analytics/payment-history`
- THEN the system MUST return a chronological projection of past and future payments
- AND the projections MUST be calculated dynamically using `firstPaymentDate`, `billingFrequency`, and `billingUnit`.

### Requirement: Exchange Rate Infrastructure
The system MUST cache exchange rates to minimize external API requests while providing accurate expense normalization.

#### Scenario: Stale-while-revalidate rate fetching
- GIVEN the cached exchange rate (`rateUpdatedAt`) is older than 24 hours
- WHEN an expense normalization calculation occurs
- THEN the system MUST immediately use the stale rate for the calculation
- AND the system MUST asynchronously update the exchange rate via an external API.

## MODIFIED Requirements

### Requirement: Subscription Listing Filters
The system MUST allow users to filter their subscriptions by category and billing cycle parameters.
(Previously: `GET /api/v1/subscriptions` did not accept `category` or `billingCycle` query parameters.)

#### Scenario: Filter by category
- GIVEN the user has various subscriptions
- WHEN the user requests `GET /api/v1/subscriptions?category=Software`
- THEN the system MUST return only subscriptions where the category matches "Software".

#### Scenario: Filter by billing cycle
- GIVEN the user has both monthly and yearly subscriptions
- WHEN the user requests `GET /api/v1/subscriptions?billingCycle=monthly`
- THEN the system MUST return only subscriptions configured with a monthly billing cycle.
