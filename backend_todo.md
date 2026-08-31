# Backend Requirements TODO List

Based on the comparison between [analisis_requisitos.pdf](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/analisis_requisitos.pdf) and the current codebase, here is the prioritized TODO list of missing or incomplete backend items, focusing strictly on Node.js, Express, TypeScript, and TestContainers.

## Priority 1: Subscription CRUD Refinements (RF-C)

While the `subscription` module exists, we must ensure it completely matches the required schema fields:

- [✅] Verify that creation and update logic properly handles `Cost Type` (Fixed/Variable), `Billing Cycle` (Frequency + Unit), `First Payment Date`, and `Trial End Date`.

## Priority 2: Testing Infrastructure (TestContainers)

The current integration suite already includes `login.test.ts`, `health.test.ts`, plus CRUD coverage for `user`, `category`, `currency`, and `subscription`.

- [x] **Integrate API Tests**:
  - [x] Add integration tests for `user`, `category`, `currency`, and `subscription` CRUD operations.
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

---

## Post-v1 Backlog (decisiones diferidas desde SM-142)

### SM-143 — Migración de datos para producción (bloqueante para deploy)

La migración `20260816053311_change_is_active_for_status_enum` hace `DROP COLUMN isActive` directamente, perdiendo la data de esa columna. Aceptable en dev/test (la data viene del seed), pero **antes del primer deploy con datos reales** hay que reescribirla:

1. `ADD COLUMN status` (nullable).
2. `UPDATE ... CASE WHEN "isActive" THEN 'ACTIVE' ELSE 'CANCELLED' END` — decisión documentada: los inactivos existentes pasan a `CANCELLED` (no se sabe por qué se desactivaron; asumir pausa activaría gastos fantasma en el dashboard, lo cual es peor).
3. `ALTER COLUMN status SET NOT NULL` + `DROP COLUMN isActive`.
4. Probar la migración contra una copia con data real, no solo el seed.

### SM-144 — Historial de estados + timeline interval-aware (v1.1)

**Problema** (caso real): usuario con gym que inicia el 1 de enero (pagos los 1 de cada mes), pausa el 1 de abril, reanuda el 7 de agosto, pausa el 22 de noviembre y reanuda el 3 de enero del año siguiente. Con el modelo actual de SM-142 (`resumedAt`, un solo campo):

- Cada reanudación **pisa** la anterior → imposible reconstruir los intervalos activos.
- La fecha de cada pausa **no se guarda en ningún lado** (`updatedAt` no sirve: se actualiza con cualquier edición).
- El timeline de analytics muestra el "cronograma contractual" desde `firstPaymentDate`, sin los huecos de pausa — los meses sin pagar aparecen como si se hubieran pagado.
- Caso límite conocido: pausa accidental corregida enseguida pisa `resumedAt`; el dashboard futuro se recalcula bien (aceptable), pero el historial queda incorrecto.

**Solución**: tabla `SubscriptionStatusHistory(subscriptionId, status, changedAt)` con una fila por transición. El timeline de analytics proyecta pagos solo dentro de intervalos `[ACTIVE → PAUSED|CANCELLED)`. El dashboard NO necesita la tabla: su ancla (`resumedAt ?? firstPaymentDate`) es la denormalización del último evento ACTIVE.

**Scope**: modelo + migración, escritura del evento dentro de `updateSubscriptionStatus` (misma transacción que el update), proyección interval-aware en `analytics.service.ts`, tests con múltiples pausas/reanudaciones.

**Restricción de diseño**: `CANCELLED` es terminal (SM-142 lo garantiza), así que un historial nunca tiene eventos posteriores a un CANCELLED.
