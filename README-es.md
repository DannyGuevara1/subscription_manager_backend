*Read this in [English](README.md)*

# Subscription Manager API

![Node.js](https://img.shields.io/badge/Node.js-5.1.0-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1.0-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

Una API robusta, escalable y mantenible diseñada para gestionar suscripciones recurrentes, normalizar costos a través de diferentes ciclos de facturación, y proveer analíticas detalladas de gastos mensuales y anuales con soporte multi-moneda.

## 🚀 Características Principales

- **Gestión Integral de Suscripciones**: Soporte para planes con costo fijo o variable, manejo de múltiples ciclos de facturación (Días, Semanas, Meses, Años) y gestión de periodos de prueba (Trials).
- **Dashboard y Analíticas**: Endpoints optimizados para obtener métricas de gasto total, alertas de pago, y las próximas renovaciones ordenadas por proximidad.
- **Normalizador de Costos Automático**: Motor que convierte de manera precisa el costo de cualquier suscripción a su equivalente mensual y anual, independientemente del ciclo de facturación original.
- **Soporte Multi-Moneda (Forex)**: Conversión de divisas en tiempo real para las analíticas integrando OpenExchangeRates y un sistema de caché de alta disponibilidad.
- **Autenticación Segura**: Sistema de registro y login utilizando JWT, con cifrado de contraseñas mediante bcrypt.

---

## 🏛️ Decisiones Arquitectónicas y Técnicas

A lo largo del desarrollo de esta API, se tomaron decisiones de diseño con el objetivo de priorizar la **mantenibilidad**, **fiabilidad** y la **resiliencia del sistema**.

### 1. Clean Architecture y Dependency Injection
La base del proyecto está construida sobre los principios de Clean / Hexagonal Architecture. El dominio y los casos de uso están completamente desacoplados del framework HTTP y de la infraestructura de persistencia.
- **Awilix**: Utilizamos Awilix para la Inyección de Dependencias (IoC). Ningún servicio lee `process.env` ni instancia sus dependencias manualmente. Todo se inyecta por el constructor, lo que facilita enormemente los Unit Tests mediante mocks/stubs.

### 2. Motor de Fechas Preciso con Temporal API
El objeto `Date` nativo de JavaScript tiene [deficiencias históricas y bugs conocidos](https://tc39.es/proposal-temporal/docs/) (por ejemplo, sumar un mes al 31 de enero).
- **Decisión**: Integramos `temporal-polyfill` para realizar todos los cálculos de ciclos de facturación y periodos de prueba. Esto garantiza cálculos 100% exactos sin importar el huso horario, años bisiestos o irregularidades de fin de mes. También implementamos un patrón de `referenceDate` para un control temporal absoluto en el testing.

### 3. Patrón Stale-While-Revalidate (SWR) para Tasas de Cambio
El proyecto se integra con la API gratuita de OpenExchangeRates, la cual impone ciertas limitaciones (solo devuelve valores base USD y entrega todas las divisas en masa).
- **Decisión**: Para evitar bloqueos, agotar el Rate-Limit o introducir latencia externa en los endpoints del Dashboard, implementamos un adaptador basado en SWR. La base de datos y Redis funcionan como caché de primera línea. Si el valor de la moneda tiene una antigüedad mayor a 24 horas (`rateUpdatedAt`), la API sirve la respuesta en caché instantáneamente al cliente y actualiza el nuevo valor en _background_ asíncronamente.

### 4. Tests de Integración Fiables con Testcontainers
Los mocks son útiles para la lógica de negocio, pero insuficientes para probar consultas complejas a la base de datos o comportamientos de caché.
- **Decisión**: Usamos `@testcontainers/postgresql` y `@testcontainers/redis` para levantar contenedores de Docker efímeros durante la ejecución de los tests. Esto asegura que nuestro código interactúa con versiones reales de la infraestructura en CI/CD, eliminando el problema de "funciona en mi máquina".

### 5. Tipado Estricto y Validación
- Uso intensivo de **Zod** en la capa de transporte para validar el esquema (payload, params, query) de toda petición HTTP que entra al sistema, garantizando que el dominio solo reciba estructuras de datos consistentes (`Data Contracts` estrictos).

---

## 🛠️ Stack Tecnológico

- **Runtime & Lenguaje**: Node.js v24+, TypeScript 5.9
- **Framework HTTP**: Express 5.1
- **Base de Datos & ORM**: PostgreSQL + Prisma 6.15
- **Caché**: Redis 5
- **Validación**: Zod
- **Testing**: Node Native Test Runner (`tsx --test`) + Testcontainers + Supertest
- **Logging**: Pino

---

## 📂 Estructura de Módulos (`/src/modules`)

Cada funcionalidad está aislada en su propio módulo vertical:

- `auth/`: Lógica de autenticación, JWT y registro de usuarios.
- `user/`: Perfilado y preferencias del usuario.
- `subscription/`: Core del negocio, gestión CRUD de suscripciones y cálculo de fechas de facturación con `Temporal`.
- `category/`: Clasificación y agrupación de las suscripciones.
- `dashboard/`: Lógica analítica de sólo lectura, uso del Normalizador de Costos.
- `currency/`: Adaptadores externos, patrón SWR para el _Exchange Rate_ de divisas.
- `analytics/`: Generación de reportes y cruce de datos financieros.

---

## 💻 Instalación y Uso Local

### Requisitos Previos
- Node.js v24.x o superior
- Docker y Docker Compose (para bases de datos locales)
- PostgreSQL y Redis

### Pasos

1. **Clonar el repositorio y descargar dependencias**
   ```bash
   git clone https://github.com/DannyGuevara1/subscription_manager_backend.git
   cd subscription_manager_backend
   npm install
   ```

2. **Configurar el entorno**
   Copia el archivo `.env.example` a `.env` y configura tus credenciales locales (Base de datos, Redis, JWT Secret, API Key de OpenExchangeRates).
   ```bash
   cp .env.example .env
   ```

3. **Base de datos e Infraestructura**
   Aplica las migraciones de Prisma y corre los seeders.
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Levantar servidor en desarrollo**
   ```bash
   npm run dev
   ```

5. **Correr los tests (Requiere Docker activo)**
   ```bash
   npm run test
   ```

---

*Proyecto diseñado bajo las mejores prácticas de ingeniería de software backend para entornos de producción.*