*Leer en [Español](README-es.md)*

# Subscription Manager API

![Node.js](https://img.shields.io/badge/Node.js-5.1.0-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

A robust, scalable, and maintainable API designed to manage recurring subscriptions, normalize costs across different billing cycles, and provide detailed monthly and annual spending analytics with multi-currency support.

## 🚀 Key Features

- **Comprehensive Subscription Management**: Support for fixed or variable cost plans, multiple billing cycles (Days, Weeks, Months, Years), and trial periods.
- **Dashboard & Analytics**: Optimized endpoints to fetch total spend metrics, payment alerts, and upcoming renewals sorted by proximity.
- **Automatic Cost Normalizer**: Engine that accurately converts the cost of any subscription to its monthly and annual equivalent, regardless of the original billing cycle.
- **Multi-Currency Support (Forex)**: Real-time currency conversion for analytics integrating OpenExchangeRates and a highly available caching system.
- **Secure Authentication**: Registration and login system using JWT, with password hashing via bcrypt.

---

## 🏛️ Architectural & Technical Decisions

Throughout the development of this API, design decisions were made to prioritize **maintainability**, **reliability**, and **system resilience**.

### 1. Clean Architecture & Dependency Injection
The project's foundation is built on Clean / Hexagonal Architecture principles. The domain and use cases are completely decoupled from the HTTP framework and persistence infrastructure.
- **Awilix**: We use Awilix for Inversion of Control (IoC). No service reads `process.env` directly or instantiates its dependencies manually. Everything is injected via the constructor, which greatly facilitates Unit Testing through mocks and stubs.

### 2. Precise Date Engine with Temporal API
The native JavaScript `Date` object has [historical flaws and known bugs](https://tc39.es/proposal-temporal/docs/) (e.g., adding a month to January 31st).
- **Decision**: We integrated `temporal-polyfill` to perform all billing cycle and trial calculations. This guarantees 100% accurate calculations regardless of timezones, leap years, or end-of-month irregularities. We also implemented a `referenceDate` pattern for absolute temporal control in testing.

### 3. Stale-While-Revalidate (SWR) Pattern for Exchange Rates
The project integrates with the free tier of the OpenExchangeRates API, which imposes certain limitations (only returns USD-based values and delivers all currencies in bulk).
- **Decision**: To avoid blocking, rate-limit exhaustion, or introducing external latency to Dashboard endpoints, we implemented an SWR-based adapter. The database and Redis act as a first-line cache. If the currency value is older than 24 hours (`rateUpdatedAt`), the API instantly serves the cached response to the client and updates the new value in the background asynchronously.

### 4. Reliable Integration Tests with Testcontainers
Mocks are useful for business logic, but insufficient for testing complex database queries or caching behaviors.
- **Decision**: We use `@testcontainers/postgresql` and `@testcontainers/redis` to spin up ephemeral Docker containers during test execution. This ensures our code interacts with real infrastructure versions in CI/CD, eliminating the "it works on my machine" problem.

### 5. Strict Typing & Validation
- Intensive use of **Zod** at the transport layer to validate the schema (payload, params, query) of every incoming HTTP request, ensuring the domain only receives consistent data structures (strict `Data Contracts`).

---

## 🛠️ Tech Stack

- **Runtime & Language**: Node.js v24+, TypeScript 5.9
- **HTTP Framework**: Express 5.1
- **Database & ORM**: PostgreSQL + Prisma 6.15
- **Cache**: Redis 5
- **Validation**: Zod
- **Testing**: Node Native Test Runner (`tsx --test`) + Testcontainers + Supertest
- **Logging**: Pino

---

## 📂 Module Structure (`/src/modules`)

Each feature is isolated in its own vertical module:

- `auth/`: Authentication logic, JWT, and user registration.
- `user/`: User profiling and preferences.
- `subscription/`: Business core, subscription CRUD management, and billing date calculations with `Temporal`.
- `category/`: Classification and grouping of subscriptions.
- `dashboard/`: Read-only analytical logic, utilizing the Cost Normalizer.
- `currency/`: External adapters, SWR pattern for currency Exchange Rates.
- `analytics/`: Report generation and financial data crossing.

---

## 💻 Local Installation and Usage

### Prerequisites
- Node.js v24.x or higher
- Docker and Docker Compose (for local databases)
- PostgreSQL and Redis

### Steps

1. **Clone the repository and download dependencies**
   ```bash
   git clone https://github.com/DannyGuevara1/subscription_manager_backend.git
   cd subscription_manager_backend
   npm install
   ```

2. **Configure the environment**
   Copy the `.env.example` file to `.env` and set your local credentials (Database, Redis, JWT Secret, OpenExchangeRates API Key).
   ```bash
   cp .env.example .env
   ```

3. **Database and Infrastructure**
   Apply Prisma migrations and run seeders.
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run the tests (Requires Docker running)**
   ```bash
   npm run test
   ```

---

*Project designed under backend software engineering best practices for production environments.*