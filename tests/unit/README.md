# Unit Testing Plan (Sprint 2 dias)

## Objetivo
Construir una base solida de pruebas unitarias para desbloquear Phase 3 (dashboard, analytics, currency updater) con foco en:
- seguridad
- precision monetaria
- consistencia del pipeline de errores

## Estructura recomendada
Mantener estructura espejo de integration para reducir contexto mental y facilitar trazabilidad.

- tests/unit/auth
- tests/unit/subscription
- tests/unit/shared
- tests/unit/user
- tests/unit/category
- tests/unit/currency

## Orden de ejecucion (prioridad)

### P0 (bloqueante)
1. shared
2. auth
3. subscription

### P1 (importante)
4. user
5. category
6. currency

## Sprint propuesto (2 dias)

### Dia 1 (P0)

#### Bloque 1: shared (manana)
Crear:
- tests/unit/shared/app-error.test.ts
- tests/unit/shared/error-factory.test.ts
- tests/unit/shared/error-normalizer.test.ts

Casos minimos:
1. app-error: no sobreescribe campos RFC por extensions reservadas.
2. app-error: omite extensions en log si vacio.
3. error-factory: createError retorna tipo/status correctos para cada key principal.
4. error-factory: createError lanza TypeError con typeKey invalido.
5. error-normalizer: zod error -> validation error 422.
6. error-normalizer: non-Error throw -> internal 500 con fallback.

#### Bloque 2: auth (tarde)
Crear:
- tests/unit/auth/auth.middleware.test.ts
- tests/unit/auth/auth.service.test.ts

Casos minimos:
1. middleware: sin ACCESS_TOKEN -> 401.
2. middleware: JWT_ACCESS_SECRET faltante -> 500.
3. middleware: token firmado pero payload invalido -> 401.
4. middleware: token valido y payload valido -> req.user asignado y next sin error.
5. auth.service: generateAccessToken usa HS256 y access secret.
6. auth.service: generateRefreshToken usa HS256 y refresh secret.
7. auth.service: refreshSession con token no almacenado -> unauthorized.
8. auth.service: refreshSession con mismatch (reuso) -> revoca y unauthorized.

### Dia 2 (P0 + P1)

#### Bloque 3: subscription (manana)
Crear:
- tests/unit/subscription/subscription.service.test.ts
- tests/unit/subscription/subscription.repository.test.ts

Casos minimos:
1. service: createSubscription valida currency y category ownership.
2. service: getSubscriptionById valida ownership y notFound.
3. service: updateSubscription ajusta firstPaymentDate cuando trialEndsOn existe.
4. repository: serializa cost como string exacto con dos decimales.
5. repository: no retorna number en cost (regresion de precision).

#### Bloque 4: user/category/currency (tarde)
Crear al menos 1 archivo por modulo:
- tests/unit/user/user.service.test.ts
- tests/unit/category/category.service.test.ts
- tests/unit/currency/currency.service.test.ts

Casos minimos sugeridos:
1. user: USER solo accede a su perfil.
2. user: SUPPORT recibe perfil restringido.
3. category: ownership check en update/delete.
4. currency: notFound en getByCode.

## Definicion de listo (DoD)
1. Tests unitarios P0 en verde.
2. Al menos 20-30 casos unitarios.
3. Ninguna regresion en integration.
4. Cobertura alta en auth/shared/subscription (objetivo >= 80% en esos modulos).

## Comandos sugeridos
- Ejecutar solo unit:
  npx tsx --test tests/unit/**/*.test.ts

- Ejecutar solo integration:
  npx tsx --test tests/integration/**/*.test.ts

- Ejecutar todo:
  npx tsx --test tests/**/*.test.ts

## Referencias de estilo en el proyecto
Usar como guia los patrones existentes:
- tests/integration/shared/error-normalizer.test.ts
- tests/integration/shared/validate-request.test.ts
- tests/integration/auth/login.test.ts
- tests/integration/subscription/subscription.test.ts
