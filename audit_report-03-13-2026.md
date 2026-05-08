---

Technical Audit Report: Subscription Manager Backend

**Date:** 2026-03-13
**Auditor Role:** Senior Full-Stack Engineer & Solutions Architect
**Stack:** Node.js 24 / Express 5.1 / TypeScript 5.9 / Prisma 6.15 / Redis / PostgreSQL 15

---

## 1. Executive Summary

**Health Score: 6.5 / 10**

The Subscription Manager Backend demonstrates solid fundamentals: a well-organized modular architecture, a thoughtful RFC 9457 error pipeline, comprehensive Zod validation, and a robust Testcontainers-based integration test suite. The developer clearly understands separation of concerns and modern Node.js patterns.

However, the codebase has **critical data-integrity risks** (floating-point money), **authentication vulnerabilities** (shared JWT secrets, no body-size limits), **operational blind spots** (no graceful shutdown, broken stack traces on Linux), and **incomplete feature coverage** (dashboard, analytics, currency updater cron job are entirely missing per the requirements doc). Several of these are low-effort fixes with high payoff.

| Area | Rating | Note |
|---|---|---|
| Architecture & Modularity | 8/10 | Clean layered modules, Awilix DI |
| Code Quality | 7/10 | Consistent patterns, some dead code and type casts |
| Security | 5/10 | Good cookie config; JWT and body-size issues |
| Data Integrity | 4/10 | `Float` for money, incorrect repo return types |
| Error Handling | 8/10 | Excellent RFC 9457 pipeline, minor edge cases |
| Test Coverage | 6/10 | Good integration tests; no unit tests, missing negative cases |
| Production Readiness | 4/10 | No graceful shutdown, no health endpoint, single-stage Docker |
| Feature Completeness | 5/10 | CRUD solid; dashboard/analytics/cron entirely missing |

---

## 2. Deep Technical Analysis

### 2.1 Architecture & Design Patterns

**Strengths:**

The project follows a clean 4-layer architecture per module:

```
Routes → Controllers → Services → Repositories
         (HTTP)        (Business)  (Data Access)
```

Each module (`auth`, `user`, `category`, `currency`, `subscription`) is self-contained under `src/modules/` with consistent file naming (`.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.dto.ts`, `.type.ts`). Barrel exports provide clean import paths. Awilix auto-discovers modules via glob patterns — adding a new module requires zero manual container registration.

**Concerns:**

**C1: Untyped DI Container** — `src/shared/container/container.types.ts` is empty. All `container.resolve()` calls are stringly-typed. Renaming a constructor parameter silently breaks injection at runtime with no compile-time warning.

```typescript
// Current: CLASSIC injection mode — fragile, relies on parameter names
constructor(loginService: LoginService, redis: redis.RedisClientType, ...) 

// Recommended: PROXY injection mode with a typed Cradle
interface Cradle {
  loginService: LoginService;
  redis: redis.RedisClientType;
  // ...
}
// Then: constructor({ loginService, redis }: Cradle) — refactor-safe
```

**C2: Side-effect-laden module imports** — The DI container (`containerPromise`) and route setup (`src/routes/index.ts`) both use top-level `await`, meaning merely importing these modules triggers full container bootstrapping and async I/O. This complicates isolated unit testing and makes module load order significant.

**C3: Cross-module service coupling** — `SubscriptionService` directly depends on `UserService`, `CategoryService`, and `CurrencyService`. While not inherently wrong, this creates tight coupling. A future `DashboardService` would add even more cross-dependencies. Consider a validation-helper pattern or event-driven decoupling as the module count grows.

---

### 2.2 Code Quality

**Anti-patterns & Issues:**

**Q1: Dead types in every module** — Each `.type.ts` file defines a `Safe*` type (e.g., `SafeUser`, `SafeCurrency`, `SafeSubscription`) that is **never used**. The codebase uses `Safe*Dto` from Zod schemas instead. These should be removed.

**Q2: Redundant user-existence checks** — Both `CategoryService.createCategory` and `SubscriptionService.createSubscription` call `this.userService.getUserById(userId)` for already-authenticated users. The user's existence is guaranteed by the valid JWT. This adds an unnecessary DB query per create operation.

```typescript
// Current (subscription.service.ts:77)
await this.userService.getUserById(userId); // Redundant — user is already authenticated

// Recommended: Remove. The FK constraint provides a safety net if the user is deleted mid-request.
```

**Q3: Incorrect Prisma repository return types** — Multiple repositories declare `Promise<T | null>` for `update()` and `delete()` methods, but Prisma never returns `null` for these — it throws `P2025`. This leads to dead null-check code in services (e.g., `currency.service.ts:90-98`).

**Q4: Inconsistent HTTP status codes for DELETE** — `CategoryController.deleteCategory` returns `200` with body data; `SubscriptionController` and `CurrencyController` return `204 No Content`. The subscription integration test expects `200` for delete but the controller sends `204` — **a live test correctness issue**.

**Q5: Duplicated interface definitions** — `CurrencyController` and `SubscriptionController` both define local `*Params` interfaces instead of importing from their respective `.type.ts` files.

**Q6: Mixed language in error messages** — Rate limit messages, 404 messages, and Prisma error messages are in Spanish. Zod validation messages and auth error messages are in English. Choose one language for user-facing API responses (i18n keys recommended).

---

### 2.3 Security

**S1 [CRITICAL]: No `express.json()` body size limit**

```typescript
// Current (app.ts:68)
app.use(express.json());

// Recommended
app.use(express.json({ limit: '100kb' }));
```

Without a limit, an attacker can send a multi-GB JSON payload, exhausting server memory. This is a trivial denial-of-service vector.

**S2 [HIGH]: Same JWT secret for access and refresh tokens**

```typescript
// auth.service.ts — both methods use the same secret
generateAccessToken()  → jwt.sign(payload, process.env.JWT_SECRET, ...)
generateRefreshToken() → jwt.sign(payload, process.env.JWT_SECRET, ...)
```

If an attacker obtains the access token secret (e.g., via a leaked env var), they can forge refresh tokens and maintain persistent access. Best practice: use `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

**S3 [HIGH]: No JWT algorithm pinning**

Neither `jwt.sign()` nor `jwt.verify()` specify an `algorithm` option. This leaves the door open for algorithm confusion attacks (e.g., `alg: "none"` or switching from HS256 to RS256).

```typescript
// Recommended
jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: ... });
jwt.verify(token, secret, { algorithms: ['HS256'] });
```

**S4 [HIGH]: Unprotected user profile endpoint** — `GET /api/v1/users/:id` is accessible to any authenticated user, not restricted to the owner or admins. User A can fetch User B's full profile (name, email, currency preference).

**S5 [MEDIUM]: JWT payload not validated at runtime**

```typescript
// auth.middleware.ts:42
req.user = jwt.verify(ACCESS_TOKEN, SECRET_KEY) as JWTPayload;
```

The `as` cast trusts the payload shape without runtime validation. A manipulated token could inject unexpected properties into `req.user`. Should parse through a Zod schema.

**S6 [MEDIUM]: CORS rejection produces 500 ISE**

```typescript
// app.ts:60
return callback(new Error('Not allowed by CORS'));
```

This plain `Error` passes through the normalizer as a generic error, resulting in `500 Internal Server Error` with `isOperational: false`. It should be a `403 Forbidden` operational error.

**S7 [MEDIUM]: Cookie maxAge diverges from JWT expiry** — Cookie durations are hardcoded in `auth.controller.ts` (`5 * 60 * 1000` and `7 * 24 * 60 * 60 * 1000`) while JWT expiry is read from env vars. Changing the env var without updating the cookie code creates a silent mismatch.

---

### 2.4 Data Integrity

**D1 [CRITICAL]: Floating-point money**

```prisma
// schema.prisma:52
cost  Float   // Maps to DOUBLE PRECISION
```

This is the #1 most impactful finding. IEEE 754 floats cannot precisely represent decimal values. `0.1 + 0.2 === 0.30000000000000004`. For a subscription manager whose primary purpose is financial tracking, this undermines the core value proposition.

```prisma
// Recommended
cost  Decimal @db.Decimal(10, 2)
```

This maps to PostgreSQL's `NUMERIC(10,2)`, which provides exact decimal arithmetic. Prisma returns `Decimal` objects; use `.toNumber()` or string serialization in DTOs.

**D2: No database index on `Subscription.userId`** — Every list query filters by `userId`. Without an explicit index (Prisma only creates implicit indexes for `@unique` and `@relation`), PostgreSQL performs a sequential scan on the subscriptions table as it grows.

```prisma
// Recommended: Add to Subscription model
@@index([userId])
```

---

### 2.5 Error Handling

The two-stage error pipeline (normalizer → handler) is the strongest part of the codebase. RFC 9457 compliance, comprehensive Prisma error mapping, and the `isOperational` distinction are all well-executed.

**E1 [HIGH]: Missing catch-all in error normalizer** — If a non-Error value is thrown (string, number, `null`), none of the `instanceof` checks match and the function ends without calling `next()`. The request hangs indefinitely.

```typescript
// Current: error.normalizer.ts ends at line 116 with `if (err instanceof Error)`
// No fallback for: throw "something went wrong" or throw 42

// Recommended: Add at the end of the function
const fallbackError = internalError({
  detail: `Non-Error value thrown: ${String(err)}`,
  instance: req.originalUrl,
  isOperational: false,
});
return next(fallbackError);
```

**E2 [MEDIUM]: Extensions overwrite standard fields** — `AppError.toProblemDetails()` uses `Object.assign(problemDetails, this.extensions)`. If an extension key is `type`, `title`, `status`, `detail`, or `instance`, the standard field is silently overwritten.

```typescript
// Recommended: Namespace extensions or filter reserved keys
const { type, title, status, detail, instance, ...safeExtensions } = this.extensions;
Object.assign(problemDetails, safeExtensions);
```

**E3 [MEDIUM]: Stack trace filter broken on Linux** — `app.error.ts:61` uses `line.includes('src\\')` (Windows backslash). On Linux/Docker, paths use `src/`, so the filter never matches and the fallback always executes.

```typescript
// Fix
return line.includes('src/') && !line.includes('node_modules');
```

**E4 [LOW]: Missing `Content-Type: application/problem+json`** — RFC 9457 specifies this media type. The error handler uses Express's default `application/json`.

---

### 2.6 Production Readiness

**P1 [CRITICAL]: No graceful shutdown**

```typescript
// Current: server.ts — no signal handlers
app.listen(PORT, () => { console.log(...) });

// Recommended
const server = app.listen(PORT, () => { logger.info(...) });

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close();
  await redisClient.quit();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

Without this, Docker `stop` sends SIGTERM, the process doesn't respond, Docker waits 10 seconds, then sends SIGKILL — leaving connections unclosed and potential data corruption.

**P2 [HIGH]: No health check endpoint** — No `GET /health` or `GET /api/v1/health`. Load balancers, Kubernetes probes, and Docker healthchecks all need this.

**P3 [HIGH]: Single-stage Dockerfile running as root**

```dockerfile
# Current: installs devDependencies in production image, runs as root

# Recommended: Multi-stage build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-alpine AS runner
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
USER app
HEALTHCHECK CMD wget --spider -q http://localhost:3000/health || exit 1
CMD ["npm", "run", "start"]
```

**P4 [MEDIUM]: Logger not used at startup** — `server.ts:13` uses `console.log` instead of the configured Pino logger. Redis errors also go to `console.error`. In production, these bypass structured logging and may be lost in containerized environments.

---

### 2.7 Test Coverage Assessment

| Module | Integration Tests | Coverage Assessment |
|---|---|---|
| Auth | Login, Register, Logout, Refresh | Good. Missing: expired tokens, reuse detection, wrong secret |
| Category | Full CRUD + ownership + validation | Excellent |
| Currency | CRUD (admin) | Missing: non-admin rejection, validation errors |
| Subscription | Full CRUD + ownership + trial logic | Excellent. Status code mismatch on delete |
| User | CRUD + password change | Missing: non-admin rejection, email uniqueness on update |
| Health | Smoke tests | Accepts 500 as valid — too permissive |

**Key gaps:**
- Zero unit tests — all testing is integration-level
- Rate limiting is disabled in tests (`NODE_ENV === 'test'`), never exercised
- No tests for error edge cases (non-Error throws, missing env vars)
- No tests for authorization edge cases (non-admin users hitting admin endpoints)

---

## 3. Implementation Roadmap

### Phase 1: Critical Fixes (Immediate — 1-2 days)

| # | Fix | Impact | Effort | File(s) |
|---|---|---|---|---|
| 1 | Change `Subscription.cost` from `Float` to `Decimal` | Eliminates financial precision errors | Low | `schema.prisma`, DTOs, seed |
| 2 | Add `express.json({ limit: '100kb' })` | Prevents memory-exhaustion DoS | Trivial | `app.ts:68` |
| 3 | Add catch-all fallback in error normalizer | Prevents request hangs | Trivial | `error.normalizer.ts` |
| 4 | Fix stack trace filter: `'src\\'` → `'src/'` | Fixes broken stack traces on Linux/Docker | Trivial | `app.error.ts:61` |
| 5 | Pin JWT algorithm: `{ algorithms: ['HS256'] }` | Prevents algorithm confusion attacks | Trivial | `auth.middleware.ts`, `auth.service.ts` |
| 6 | Add graceful shutdown to `server.ts` | Prevents connection leaks on deploy | Low | `server.ts` |
| 7 | Separate JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) | Mitigates token confusion attacks | Low | `.env.*`, `auth.service.ts`, `auth.middleware.ts` |

### Phase 2: Refactoring (Short-term — 1-2 weeks)

| # | Improvement | Rationale |
|---|---|---|
| 8 | Add `@@index([userId])` on Subscription model | Query performance as data grows |
| 9 | Add user-scoping to `GET /users/:id` (owner or admin only) | Privacy: prevents cross-user data exposure |
| 10 | Standardize DELETE responses to `204 No Content` across all modules | Consistency; fix category controller |
| 11 | Remove dead types (`SafeUser`, `SafeCurrency`, `SafeSubscription` in `.type.ts` files) | Code hygiene |
| 12 | Remove redundant `getUserById` calls for authenticated users | Eliminate unnecessary DB queries |
| 13 | Fix Prisma repository return types (`Promise<T>` not `Promise<T \| null>` where throws on not-found) | Type correctness |
| 14 | Type the DI container cradle (`container.types.ts`) | Compile-time DI safety |
| 15 | Multi-stage Dockerfile + non-root user + health check | Cut image size by ~70%, improve security |
| 16 | Add `Content-Type: application/problem+json` to error responses | RFC 9457 compliance |
| 17 | Add pagination to all list endpoints (`GET /users`, `GET /categories`, `GET /subscriptions`) | Prevent unbounded result sets |
| 18 | Unify error message language (English or i18n keys) | Professional consistency |
| 19 | Add unit tests for services, error factory, and middleware | Improve test coverage breadth |
| 20 | Fix subscription delete test to expect `204` not `200` | Test correctness |

### Phase 3: Scalability Plan (Long-term — 1-2 months)

| # | Evolution | Description |
|---|---|---|
| 21 | **Dashboard module** (RF-B) | Monthly/annual expense calculation, currency conversion, upcoming renewals. Per `backend_todo.md` Priority 4. |
| 22 | **Analytics module** (RF-D) | Expense-by-category aggregation, payment history projection, charting data endpoints. |
| 23 | **Currency updater cron job** (RNF-03) | Scheduled task (node-cron or BullMQ) to update exchange rates every 24h. Per `backend_todo.md` Priority 3. |
| 24 | **Email verification on registration** | Prevents bogus accounts; required for financial trust. |
| 25 | **Account lockout / adaptive rate limiting** | After N failed login attempts, temporarily lock the account or escalate rate limiting. |
| 26 | **Concurrent session support** | Move from single-refresh-token-per-user to per-device tokens (Redis set per user). |
| 27 | **Pagination + cursor-based querying** | Replace unbounded `findMany` with cursor/offset pagination for all list endpoints. |
| 28 | **OpenAPI/Swagger documentation** | Auto-generate from Zod schemas for frontend team and API consumers. |
| 29 | **CI/CD pipeline** | GitHub Actions: lint → type-check → test (Testcontainers) → build → Docker push. |
| 30 | **Observability stack** | Structured logging with pino redaction, distributed tracing (OpenTelemetry), health/readiness probes. |

---

## Summary

The codebase has a strong architectural foundation and demonstrates good engineering discipline in its module structure, validation layer, and error handling pipeline. The most impactful immediate actions are: **fix floating-point money** (Phase 1, #1), **add body size limits** (#2), **fix the error normalizer catch-all** (#3), and **separate JWT secrets** (#7). These four changes alone would significantly improve the security and data integrity posture with minimal effort.

The Phase 2 refactoring items are mostly about consistency, dead code removal, and hardening patterns that already exist. Phase 3 addresses the significant feature gaps identified in `requirements_analysis.md` and `backend_todo.md` — specifically the dashboard, analytics, and currency updater modules that form the core differentiating value of the application.
