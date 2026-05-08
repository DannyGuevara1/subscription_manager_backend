# Audit de Progreso — Subscription Manager Backend
**Fecha de auditoría:** 2026-03-22
**Reporte base:** [audit_report-03-13-2026.md](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/audit_report-03-13-2026.md)
**Stack:** Node.js / Express 5 / TypeScript / Prisma 6 / PostgreSQL / Redis

---

## Phase 1: Critical Fixes

| # | Tarea | Estado | Observaciones Técnicas |
|---|---|---|---|
| 1 | Cambiar `Subscription.cost` de `Float` a `Decimal` | ✅ **Cumplido** | `schema.prisma:52` usa `Decimal @db.Decimal(10,2)`. El repositorio convierte con `.toNumber()` en [toDomain()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#15-30). Migración aplicada correctamente. |
| 2 | Agregar `express.json({ limit: '100kb' })` | ✅ **Cumplido** | `app.ts:68` — `app.use(express.json({ limit: '100kb' }))`. Idéntico al snippet recomendado en el reporte. |
| 3 | Agregar catch-all fallback en el error normalizer | ✅ **Cumplido** | `error.normalizer.ts:117–122` — bloque final captura cualquier valor no-Error con `internalError()` y llama `next()`. El request ya no puede quedar colgado. |
| 4 | Corregir filtro de stack trace: `'src\\'` → `'src/'` | ✅ **Cumplido** | `app.error.ts:61` — el filtro usa `line.includes('src/')` (slash Unix). Funciona correctamente en Linux/Docker. |
| 5 | Pinear algoritmo JWT: `{ algorithms: ['HS256'] }` | ✅ **Cumplido** | `auth.service.ts:64,82` — `signOptions` incluye `algorithm: 'HS256'`. `auth.middleware.ts:43` — `jwt.verify` usa `{ algorithms: ['HS256'] }`. Ambos lados asegurados. |
| 6 | Agregar graceful shutdown a [server.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/server.ts) | ✅ **Cumplido** | `server.ts:17–47` — implementa [shutdown()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/server.ts#17-45) completo: `server.close()` → `redisClient.quit()` → `prisma.$disconnect()` → `process.exit(0)`, con timeout forzado de 30 s. Registrado en `SIGTERM` y `SIGINT`. |
| 7 | Separar secrets JWT (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`) | ✅ **Cumplido** | `auth.service.ts:50` usa `JWT_ACCESS_SECRET`, `auth.service.ts:71` usa `JWT_REFRESH_SECRET`. `auth.middleware.ts:23` lee `JWT_ACCESS_SECRET`. Los tokens de acceso y refresco ya no comparten secreto. |

> **✅ Phase 1 completada al 100% (7/7 ítems)**

---

## Phase 2: Refactoring

| # | Tarea | Estado | Observaciones Técnicas |
|---|---|---|---|
| 8 | Agregar `@@index([userId])` en modelo [Subscription](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.service.ts#163-188) | ✅ **Cumplido** | `schema.prisma:64` — `@@index([userId])` presente. Las queries [findAll(userId)](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#31-41) utilizarán este índice. |
| 9 | Restringir `GET /users/:id` a dueño o admin | ✅ **Cumplido** | `user.routes.ts:13-20` — añadido middleware [requireOwnerOrAdmin](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.routes.ts#13-21) a las rutas de [/:id](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/auth/auth.middleware.ts#8-55), restringiendo acceso solo a dueño, ADMIN y SUPPORT. |
| 10 | Estandarizar DELETE a `204 No Content` en todos los módulos | ✅ **Cumplido** | `category.controller.ts:81` — `res.status(204).send()`. Los otros módulos ya usaban `204`. Consistencia alcanzada en todos los controladores. |
| 11 | Eliminar tipos muertos ([SafeUser](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.service.ts#145-157), `SafeCurrency`, `SafeSubscription`) en [.type.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.type.ts) | ✅ **Cumplido** | Revisados [user.type.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.type.ts), [subscription.type.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.type.ts), [currency.type.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/currency/currency.type.ts) — ninguno contiene tipos `Safe*`. Los archivos solo declaran interfaces de dominio necesarias. |
| 12 | Eliminar llamadas redundantes a [getUserById](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.controller.ts#28-41) para usuarios autenticados | ✅ **Cumplido** | [subscription.service.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.service.ts) — [createSubscription()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.service.ts#69-108) ya no llama [getUserById](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/user/user.controller.ts#28-41). [category.service.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/category/category.service.ts) — [createCategory()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/category/category.service.ts#55-72) tampoco lo hace. Las FK y el JWT son suficiente garantía. |
| 13 | Corregir tipos de retorno del repositorio (`Promise<T>` en lugar de `Promise<T \| null>`) para [update](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#62-73) y [delete](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#74-81) | ✅ **Cumplido** | `subscription.repository.ts:65,74` — [update()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#62-73) y [delete()](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/modules/subscription/subscription.repository.ts#74-81) declaran `Promise<SubscriptionDomain>` (sin `\| null`). Prisma lanza `P2025` para registros no encontrados; los servicios ya no tienen dead null-checks. |
| 14 | Tipar el Cradle del contenedor DI ([container.types.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/shared/container/container.types.ts)) | ✅ **Cumplido** | [container.types.ts](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/shared/container/container.types.ts) exporta la interfaz [Cradle](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/src/shared/container/container.types.ts#21-50) completa con todos los servicios, repositorios, controladores y routers tipados. El contenedor ya no es stringly-typed. |
| 15 | Dockerfile multi-stage + usuario no-root + health check | ❌ **Pendiente** | [Dockerfile](file://wsl.localhost/Ubuntu/home/gueva/dev/subscription_manager/subscription_manager_backend/Dockerfile) sigue siendo single-stage con `FROM node:24-alpine`, incluye devDependencies en producción (`npm install` sin `--omit=dev`), ejecuta como root, y no tiene `HEALTHCHECK`. Implementar el build multi-stage del reporte: `builder` (compila) → `runner` (non-root user, solo `dist/` y `node_modules` de producción, `HEALTHCHECK CMD wget --spider http://localhost:3000/health`). Impacto estimado: reducción ~70% de imagen. |
| 16 | Agregar `Content-Type: application/problem+json` en respuestas de error | ✅ **Cumplido** | `error.handler.ts` ahora establece `res.setHeader('Content-Type', 'application/problem+json')` antes de responder errores (`development`, no operacional y operacional), alineando el media type con RFC 9457. |
| 17 | Paginación en todos los endpoints de lista (`/users`, `/categories`, `/subscriptions`) | ❌ **Pendiente** | Los tres endpoints `GET` de listas usan `findMany()` sin `take`/`skip` ni cursor. Con bases de datos grandes esto genera resultados ilimitados y alto consumo de memoria. Implementar query params `?page=1&limit=20` (offset-based) o `?cursor=<id>&limit=20` (cursor-based, preferible para colecciones grandes). Actualizar DTOs de respuesta para incluir metadatos de paginación (`total`, `page`, `hasNext`). |
| 18 | Unificar idioma de mensajes de error (inglés o i18n keys) | ❌ **Pendiente** | `error.handler.ts:30` — mensaje en español (`"Ha ocurrido un error inesperado..."`). Otros mensajes de error y validaciones están en inglés. El mix persiste. Decisión requerida: adoptar inglés como lengua única de la API o implementar i18n con `Accept-Language`. |
| 19 | Agregar unit tests para servicios, error factory y middleware | ❌ **Pendiente** | `tests/` solo contiene integration tests (6 suites). Cero unit tests para lógica de negocio aislada. Agregar tests unitarios para: servicios (mockeando repositorios con Sinon/Jest mocks), `error.factory.ts`, `error.normalizer.ts` (simular throws de string/number/null), y `auth.middleware.ts` (tokens expirados, algoritmo incorrecto). Framework recomendado: Node.js native `node:test` + `sinon` para mocks (consistente con el stack actual). |
| 20 | Corregir test de delete suscripción para esperar `204` en lugar de `200` | ✅ **Cumplido** | `subscription.test.ts:509` — `await ... .expect(204)`. El test ya es correcto y está alineado con el comportamiento del controlador. |

> **⚠️ Phase 2 completada al 69% (9/13 ítems)**

---

## Resumen Ejecutivo

| Fase | Total | Cumplidos | Pendientes |
|---|---|---|---|
| **Phase 1 — Critical Fixes** | 7 | 7 ✅ | 0 |
| **Phase 2 — Refactoring** | 13 | 9 ✅ | 4 ❌ |
| **Total** | **20** | **16** | **4** |

### Próximos pasos prioritarios (Phase 2 pendientes)

1. **[Alta] #9 — User profile scoping**: Es una vulnerabilidad de privacidad activa. Un guard de 2 líneas en la ruta o un método en el servicio lo resuelve.
2. **[Alta] #15 — Dockerfile multi-stage**: Bloquea un deploy seguro a producción. El reporte ya incluye el Dockerfile completo listo para copiar.
3. **[Media] #17 — Paginación**: Riesgo latente que crece con los datos. Priorizar antes de que el volumen de subscripciones sea significativo.
4. **[Media] #18 — Unificación de idioma**: Decisión de producto que desbloquea también la estrategia de i18n futura.
5. **[Baja] #19 — Unit tests**: Alta deuda de calidad, pero requiere más tiempo. Empezar por `error.normalizer.ts` y los servicios más críticos (`auth.service.ts`).
