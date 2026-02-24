# Backend Requirements TODO List

Based on the comparison between [analisis_requisitos.pdf](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/analisis_requisitos.pdf) and the current codebase, here is the prioritized TODO list of missing or incomplete backend items, focusing strictly on Node.js, Express, TypeScript, and TestContainers.

## Priority 1: Subscription CRUD Refinements (RF-C)
While the `subscription` module exists, we must ensure it completely matches the required schema fields:
- [x] Verify that creation and update logic properly handles `Cost Type` (Fixed/Variable), `Billing Cycle` (Frequency + Unit), `First Payment Date`, and `Trial End Date`.

## Priority 2: Testing Infrastructure (TestContainers)
The only test currently found is `login.test.ts` and [health.test.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/tests/integration/health.test.ts).

- [ ] **Integrate API Tests**:
  - [ ] Add integration tests for `user`, `category`, `currency`, and `subscription` CRUD operations.
  - [ ] Add integration tests for the new `dashboard` and `analytics` endpoints.
  - [ ] Add integration tests for the background currency updater job.
- [ ] **Performance Testing (RNF-02)**:
  - [ ] Set up load/performance tests to verify that dashboard calculations and list rendering return in under 2 seconds.

## Priority 3: Background Jobs & Data Reliability (RNF-03)
- [ ] **Currency Updater Cron Job**: Implement a scheduled task (e.g., using `node-cron` or `BullMQ` with Redis) to fetch and update currency exchange rates in the database every 24 hours.

## Priority 4: Dashboard & Analytics Business Logic
Currently, the codebase lacks the necessary modules to fulfill **RF-B** and **RF-D**.

- [ ] **Create `dashboard` module**: Add routes, controllers, and services for dashboard data.
- [ ] **Multi-currency Conversion**: Implement logic to convert subscription costs to the user's primary currency on the fly.
- [ ] **Expense Calculation Engine**:
  - [ ] Endpoint to calculate total monthly and annual expenses.
  - [ ] Endpoint to project payment history (past and future) based on start dates and billing cycles.
- [ ] **Alerts & Insights**:
  - [ ] Endpoint to identify the next 3-5 subscription renewals.
  - [ ] Endpoint to identify subscriptions finishing their trial period soon.
  - [ ] Endpoint to list all charges coming within the next 7 days.
- [ ] **Categorization & Filtering**:
  - [ ] Endpoint to aggregate total expenses broken down by category (for charts).
  - [ ] Endpoint (or query params) to filter subscriptions by category and billing cycle.
