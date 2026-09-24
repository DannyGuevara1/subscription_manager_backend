# Plan de cierre v1.0 — API Subscription Manager lista para deploy

Fecha de revisión: 2026-09-23. Base inspeccionada: `ac16e4b`.
Estado: diagnóstico y plan original. La implementación posterior y sus desviaciones justificadas están en [release-implementation.md](release-implementation.md); los resultados allí registrados distinguen pruebas aprobadas de verificaciones operativas pendientes.

## Objetivo y alcance

Cerrar las brechas de fidelidad financiera, preservación de datos, pruebas y operación necesarias para el primer despliegue. Reutilizar los módulos existentes y mantener el alcance centrado en la confianza del usuario en sus números.

«v1.0» identifica este hito de preparación. `package.json` y OpenAPI ya declaran `1.1.0`: no se debe bajar la versión a `1.0.0`. El número de la próxima publicación dependerá de los cambios efectivos y del historial de versiones publicadas. El backlog llamado «v1.1» en este plan significa posterior al hito; debe recibir una versión SemVer coherente al programarlo.

El entregable de esta revisión es este documento. Las modificaciones de código, migraciones, fixtures, CI y documentación de release descritas abajo son trabajo pendiente.

## Diagnóstico con evidencia

Las rutas, servicios, repositorios y DTOs muestran una arquitectura por módulos ya implementada. El inventario contiene 16 archivos unitarios y 12 de integración; el número de archivos no equivale al de suites ejecutadas. No se ejecutaron pruebas para redactar este diagnóstico.

| Área | Evidencia local | Implicación |
|---|---|---|
| Dashboard y FX | [normalizer](../src/modules/dashboard/subscription-cost-normalizer.service.ts), métodos `normalize` y `normalizeAll`; [DI](../src/shared/container/container.ts) | Cada suscripción solicita `exchangeRateProvider.getRate`; el provider real hace un fetch por invocación, incluso para monedas iguales. |
| Caché de tasas | [ExchangeRateService](../src/modules/currency/exchange-rate.service.ts), `getRateToUSD` | Ya lee DB y devuelve tasas antiguas mientras intenta refrescar. No expone `getRate(from, to)`; cambiar solo la inyección no basta. |
| Actualización masiva | [provider](../src/modules/currency/adapters/open-exchange-rate.provider.ts), `getAllRates`; `ExchangeRateService.updateAllRates` | El provider devuelve el mapa sin transformarlo y el servicio lo persiste como `exchangeRateToUSD`. Verificar y fijar la dirección de cotización antes de reutilizar esos datos. |
| Analytics | [servicio](../src/modules/analytics/analytics.service.ts), `getExpensesByCategory` | Consulta una tasa por suscripción, salvo el atajo USD. Suma costos por cobro, sin normalizar frecuencia ni descontar trials. |
| Frecuencia | `SubscriptionCostNormalizerService.normalize`; [calculador](../src/modules/subscription/subscription-calculator.service.ts) | El normalizer multiplica por `billingFrequency`; el calculador la usa como intervalo entre cobros. Para un costo cada dos años, el mensual debe dividirse entre 24. |
| Migración | [SM-143](../prisma/migrations/20260816053311_change_is_active_for_status_enum/migration.sql) | Elimina `isActive` y establece todos los estados en ACTIVE. |
| Migración siguiente | [renombrado del enum](../prisma/migrations/20260816055632_rename_option_canceled_for_cancelled/migration.sql) | Castea `CANCELED` a un enum que solo contiene `CANCELLED`: falla si hay filas con el valor antiguo. |
| Decisión anterior | [backlog](../backend_todo.md), SM-143 | Propone inactivos → CANCELLED; este plan adopta expresamente inactivos → PAUSED, según la decisión del cierre. |
| Timeline | `AnalyticsService.getPaymentTimeline`; [backlog](../backend_todo.md), SM-144 | Proyección contractual desde `firstPaymentDate`, sin historial de pausas. No equivale a pagos realmente realizados. |
| Ejecución de tests | [package.json](../package.json); [setup](../tests/setup/test-environment.ts) | `npm test` solo apunta a integración; coverage está vacío. El setup usa `db push`, por lo que no valida migraciones. |
| Contrato | [OpenAPI](openapi.yaml); [tests](../tests/integration/api-docs/api-docs.test.ts) | OpenAPI 3.1 con 32 operaciones; los tests comprueban publicación y autenticación, no correspondencia completa con rutas. |
| Operación | [app](../src/app.ts), [servidor](../src/server.ts), [logger](../src/config/logger.ts), [rutas](../src/routes/index.ts) | Hay rate limiting, Pino y cierre con timeout; health no verifica dependencias y no hay middleware general de request logging. |
| Imagen | [Dockerfile](../Dockerfile) | Multistage y usuario no root; revisar disponibilidad de Prisma CLI para migraciones, inclusión del YAML y healthcheck con PORT configurable. |
| Job | [currency-updater](../src/shared/jobs/currency-updater.job.ts) | Existe cron diario; el comentario dice UTC, pero la programación no fija timezone explícitamente. |

El backlog subestima el avance: dashboard, analytics y job ya existen y tienen tests. La presencia de auth con cookies, validación y errores estructurados es una base, no una certificación completa de seguridad ni de cobertura de todos los endpoints.

## Orden de ejecución

1. Inventariar migraciones aplicadas en cada entorno y preparar el subconjunto mínimo de fixtures legado y financiero (1.1).
2. Cerrar SM-143 (0.3), incluyendo ensayo real de la cadena de migraciones.
3. Corregir cotización de tasas y consumo del dashboard (0.1), luego batch de analytics (0.2).
4. Fijar oráculos y corregir frecuencia (0.4); completar fixtures, reconciliación y E2E (1.1–1.2).
5. Separar scripts y establecer cobertura financiera (1.3).
6. Preparar health, logging, configuración, imagen y runbook (2); cerrar CI cuando existan los comandos definitivos.
7. Actualizar contrato y decisiones con cada cambio; cerrar CHANGELOG y evidencia de release (3).

Los fixtures mínimos preceden a la migración aunque pertenezcan a la fase 1. SM-143 sigue siendo la primera corrección de producto/deploy.

## Fase 0 — Fidelidad financiera

### 0.3 Preservación de estados en migración (primer bloqueo)

**Decisión:** preservar `true → ACTIVE` y `false → PAUSED`. Sustituye la decisión anterior de SM-143 en el backlog. PAUSED conserva la posibilidad de reanudar; no se infiere una cancelación terminal a partir de un booleano.

Para una migración todavía no aplicada en entornos compartidos:

1. Crear el enum con los valores históricos que espera la cadena.
2. Añadir `status` antes de eliminar el booleano.
3. Hacer backfill explícito de ambos valores, usando los identificadores reales `"public"."Subscription"` y `"isActive"`.
4. Validar conteos, establecer `NOT NULL` y default ACTIVE, y finalmente eliminar `isActive`, dentro de una transacción apropiada.
5. Asegurar que la migración siguiente transforma `CANCELED` a `CANCELLED` antes del cast, si ese valor puede existir.

Si ya se aplicó, no reescribir a ciegas el historial ni alterar checksums para ocultar diferencias. Preparar una migración correctiva y un backfill desde backup/auditoría cuando exista evidencia. Una columna eliminada no permite reconstruir estados por sí sola; sin fuente de recuperación, registrar la pérdida y resolverla antes de declarar preservación exitosa.

**Alternativas descartadas:** aceptar el default ACTIVE pierde estados; convertir todo a CANCELLED impide reanudar; `db push` no prueba SQL histórico.

**Aceptación:** base efímera en versión previa, fixtures activos/inactivos insertados, aplicación de las migraciones reales posteriores y comprobación por ID de estado, costo, moneda, fechas y relaciones. Comparar conteos y verificar que el fallo de un paso no deja cambios parciales. Repetir sobre copia anonimizada representativa de datos reales si existe; dejar explícito cuando solo se usen fixtures. Ensayar restauración del backup y medir ventana de mantenimiento.

### 0.1 Tasas del dashboard desde caché persistida

**Decisión:** consumir `ExchangeRateService` desde el normalizer; calcular el factor origen→destino con tasas a USD. Awilix usa inyección CLASSIC y carga automática: ajustar nombre/tipo del constructor, dobles y tests de resolución; no asumir que basta una línea en el contenedor.

Auditar primero la unidad almacenada: `exchangeRateToUSD` significa USD por una unidad de moneda. Con un payload simulado de base USD donde EUR=0.8, se debe persistir EUR→USD=1.25. Contrastar el contrato del proveedor al implementar y corregir `getAllRates` o su consumidor en una única frontera. Refrescar registros existentes con dirección incorrecta antes de servirlos. Añadir casos que comparen actualización masiva y puntual.

Monedas iguales devuelven factor 1. Las tasas deben ser finitas y positivas. Una tasa ausente o inválida no debe convertirse silenciosamente en paridad 1; conservar una última tasa válida o producir el error de dominio documentado cuando no exista. El SWR mantiene disponibilidad con datos antiguos, pero la antigüedad debe ser observable.

**Alternativas descartadas:** provider directo mantiene dependencia HTTP por visita; otra caché Redis introduce un segundo mecanismo; sustituirlo por llamadas DB repetidas resuelve HTTP pero deja un costo evitable. Reutilizar el batch de 0.2 para compartir una instantánea de tasas por cálculo cuando corresponda.

**Aceptación:** diez suscripciones EUR con tasas frescas producen cero HTTP externos durante el summary; tasas antiguas permiten responder aunque el proveedor falle. Deduplicar refrescos simultáneos por moneda para evitar diez tareas SWR equivalentes. Probar moneda igual, cruzada, primaria distinta de USD, datos ausentes, inválidos y antiguos. Fijar timezone UTC del cron y un timeout del fetch para evitar refrescos indefinidos.

### 0.2 Batch de monedas en analytics

**Decisión:** reunir códigos únicos de suscripciones filtradas más moneda primaria; consultar los registros en un único batch en `CurrencyRepository`, expuesto mediante `ExchangeRateService`. Construir un mapa para el bucle y mantener la política SWR/validación común. USD puede resolverse localmente.

Seguir el patrón de categorías ya existente; no trasladar queries a controllers. Un `Promise.all` sobre `findByCode` sigue siendo N+1.

**Alternativas descartadas:** paralelizar N queries solo reduce espera; cargar todo el catálogo es innecesario cuando puede consultarse el conjunto implicado.

**Aceptación:** cero lecturas de moneda en el bucle; como máximo una consulta de tasas para monedas no USD, independientemente de N suscripciones. Probar duplicados, conjunto vacío, primaria no presente en las suscripciones y moneda desconocida. Mantener tests de permisos por usuario y filtros.

### 0.4 Oráculo financiero y semántica de agregación

**Decisión:** `cost` es importe por cobro y `billingFrequency` es cantidad de unidades entre cobros. Tras convertir moneda, el costo mensual es:

| Unidad | Equivalente mensual |
|---|---|
| DAYS | costo convertido ÷ frecuencia × 365 ÷ 12 |
| WEEKS | costo convertido ÷ frecuencia × 52 ÷ 12 |
| MONTHS | costo convertido ÷ frecuencia |
| YEARS | costo convertido ÷ frecuencia ÷ 12 |

Anual = mensual × 12. Conversión = costo × tasa-origen-a-USD ÷ tasa-primaria-a-USD. Son equivalentes presupuestarios: 52 semanas/365 días no prometen el mismo número de cargos que cualquier ventana calendario.

Los oráculos deben ser constantes documentadas, sin llamar a funciones productivas para generar el esperado. Añadir frecuencias mayores que uno en las cuatro unidades, fracciones, cero, redondeo al final y cruce de moneda. Fijar fechas UTC y controlar tanto `Date` como `Temporal.Now`; cubrir fin de mes, año bisiesto y límites de trial.

**Reconciliación:** hoy analytics representa importes por cobro. Preservar esa semántica y probar igualdad directa con dashboard en un subconjunto mensual, frecuencia 1, sin trial; con el dataset mixto, comparar cada endpoint contra su propio oráculo y una conciliación documentada por frecuencia/trial. No afirmar igualdad entre magnitudes distintas. Si se decide que analytics debe mostrar presupuesto mensual, documentar y versionar el cambio semántico antes de exigir igualdad general.

**Alternativas descartadas:** copiar fórmulas al esperado oculta regresiones; sumar cargos del timeline para validar equivalentes mensuales mezcla presupuesto y calendario; cambiar silenciosamente analytics rompe expectativas del consumidor.

**Aceptación:** el dominio bienal de USD 24 da USD 1/mes y USD 12/año (el código actual produce USD 4/mes). Trials activos tienen costo corriente cero y proyectado completo; PAUSED/CANCELLED se excluyen de agregaciones activas. VARIABLE usa el importe registrado como estimación, sin inventar consumos ni historial de facturas.

## Fase 1 — Evidencia con datos realistas

### 1.1 Fixtures compartidos

Crear `tests/fixtures/` con factories tipadas, IDs aislados, categorías, usuarios USD/EUR, tasas deterministas y constantes esperadas. Anclar el reloj en `2026-09-23T12:00:00Z`; trial hasta `2026-10-03T12:00:00Z`. Separar el formato legado `isActive` del actual `status`. No incorporar información personal de clientes.

| Fixture | Datos | Oráculo mensual USD |
|---|---|---|
| Streaming | USD 15.99, mensual, frecuencia 1 | 15.99 |
| Familiar anual | USD 199.99, anual | 199.99 ÷ 12 = 16.665833… |
| Gimnasio | USD 12, semanal | 12 × 52 ÷ 12 = 52 |
| Dominio bienal | USD 24, YEARS, frecuencia 2 | 24 ÷ 24 = 1 |
| Trial | USD 10, mensual, termina en 10 días | proyectado 10; corriente 0 |
| Pausada/reanudada | USD 8, mensual, `resumedAt` al reanudar | pausada 0; reanudada 8 |
| Cancelada | USD 9, mensual, CANCELLED | 0 en agregados activos |
| EUR para usuario USD | EUR 15.99, mensual, tasa EUR→USD 1.08 | 15.99 × 1.08 = 17.2692 |
| Variable | USD 30, mensual, VARIABLE | 30 estimados |

Con la suscripción de USD 8 pausada: proyectado mensual exacto 142.925033… → **142.93**; corriente **132.93**. Anual calculado antes de redondear: proyectado **1715.10**, corriente **1595.10**. Reanudar añade USD 8 mensuales y USD 96 anuales. Analytics actual suma importes por cobro: **309.25**, incluyendo trial; su diferencia con el summary es intencional y se explica por frecuencia y trial.

**Decisión y alternativa:** compartir builders y esperados documentados evita datasets contradictorios; evitar un seed global mutable que haga depender un test de otro. Añadir fixtures pequeños específicos para bordes sin inflar el escenario principal.

**Aceptación:** dashboard, analytics y timeline consumen los mismos datos; tests repetibles en cualquier fecha y orden, sin HTTP real al proveedor.

### 1.2 E2E de usuario real

Registrar → login con cookies → crear categorías → crear suscripciones → consultar summary, categorías y timeline → pausar → reanudar → cancelar.

En cada paso verificar estado persistido y respuesta, totales manuales, permisos y ausencia de contaminación de otro usuario. Tras reanudar, comprobar `resumedAt` sellado por servidor y nuevas fechas futuras del dashboard a partir de su ancla efectiva. CANCELLED debe ser terminal. Pausar/cancelar elimina la suscripción del timeline basado en suscripciones activas.

El timeline v1 sigue siendo contractual: no exigir eliminación de huecos históricos ni reconstrucción de pausas múltiples; eso pertenece a SM-144. Comprobar fechas esperadas, orden, moneda original, fin de trial y límites del horizonte, sin etiquetar proyecciones como pagos realizados.

**Alternativa descartada:** solo probar módulos aislados no detecta inconsistencias de wiring ni de estado entre endpoints. **Aceptación:** flujo completo repetible con PostgreSQL/Redis reales y proveedor controlado, más regresiones de los módulos existentes.

### 1.3 Scripts y cobertura

Crear `test:unit`, `test:integration`, comando dedicado de migraciones y `test:coverage`; `npm test` ejecutará unitarios e integración y propagará cualquier fallo. Verificar descubrimiento recursivo: el patrón actual puede omitir `tests/integration/health.test.ts` dependiendo de la expansión del shell. E2E y migraciones deben estar incluidos explícitamente en la puerta de CI.

Usar c8 sobre cobertura V8 de Node: c8 es una dependencia adicional, no un comando incorporado de Node. Aplicar umbral **100% por archivo** en líneas, sentencias, funciones y ramas de calculator, cost-normalizer, exchange-rate y analytics, incluyendo archivos no cargados y source maps TypeScript. No diluir el resultado con cobertura global ni excluir ramas de negocio para alcanzar el umbral.

**Alternativas descartadas:** porcentaje global alto oculta fallos financieros; ejecutar solo tests cubiertos omite archivos completos. **Aceptación:** introducir temporalmente una rama financiera sin cubrir hace fallar el gate; publicar reporte y ejecutar cada suite una sola vez por propósito, con concurrencia de contenedores acotada.

## Fase 2 — Deploy independiente de plataforma

| Entregable | Decisión y alternativa descartada | Criterios de aceptación |
|---|---|---|
| Health profundo | Mantener `/health` como liveness y añadir readiness con consulta mínima PostgreSQL y PING Redis; no depender de OpenExchangeRates para estar listo. | 200 con dependencias sanas, 503 ante caída/timeout, respuesta sin secretos; timeouts acotados y contrato OpenAPI actualizado. |
| Request logging | Middleware Pino con request ID, método, ruta, status y duración; no registrar cuerpos, cookies, Authorization ni queries sensibles. | Un evento de cierre por request, también errores; probar redacción y correlación sin exponer tokens. |
| `.env.example` | Inventario desde el código, con placeholders y obligatoriedad; no copiar `.env` reales. | Documentar NODE_ENV, PORT, DATABASE_URL, REDIS_URL, CORS_ORIGINS, secretos y expiraciones JWT, APP_ID_OPENEXCHANGERATES y ENABLE_API_DOCS. Verificar carga de configuración antes de módulos que la consumen. |
| Imagen de producción | Probar la imagen construida y preparar un paso de migración con CLI fijado a la versión del proyecto; evitar descargas implícitas con npx al arrancar. | Build, arranque no root, readiness y graceful shutdown. Verificar ruta del spec con docs habilitadas; copiar artefactos necesarios. Healthcheck respeta PORT. |
| Checklist | Runbook reproducible con backup, migración única, arranque, smoke test y recuperación; no ejecutar seed de demo en producción. | Ensayo completo en entorno desechable y evidencia de restauración; secretos inyectados, HTTPS/cookies/CORS y proxy configurados según infraestructura real. |
| GitHub Actions | Workflow al cerrar scripts: Node compatible con Docker (24), lockfile, PostgreSQL/Redis con Testcontainers y Docker disponible. | npm ci, generación Prisma, build, checks sin mutación, unitarios/integración/E2E/migraciones, coverage y smoke de imagen. Ejecutar en PR y rama principal, publicar reportes incluso ante fallo. |

Secuencia del runbook: comprobar configuración y backup restaurable → preparar tasas válidas → aplicar migraciones con un solo ejecutor → desplegar imagen identificable → readiness → smoke de register/login/refresh y dashboard → observar errores/duración del período inicial. Evitar migrar simultáneamente desde todas las réplicas. Ante fallo, detener avance y restaurar o aplicar corrección según compatibilidad; volver a la imagen anterior no revierte una migración destructiva.

**Aceptación de fase:** una persona puede seguir el checklist sin conocimiento tácito del entorno; CI reproduce los gates con datos efímeros. No declarar production-ready solo por la existencia del Dockerfile.

## Fase 3 — Documentación continua de la API

1. **`CHANGELOG.md` en raíz:** Keep a Changelog + SemVer; entradas fechadas Added/Changed/Fixed/Removed. Retrodocumentar `1.1.0` desde cambios verificables y fecha de publicación comprobada; no inventar una fecha histórica. Mantener cambios todavía no publicados en Unreleased. Explicar correcciones de montos, migraciones y compatibilidad.
2. **`docs/openapi.yaml`:** contrato en el mismo PR que endpoint, campo, semántica o error. Extender `api-docs.test.ts` con parseo/validación e inventario método+ruta comparado contra rutas reales, normalizando parámetros Express/OpenAPI y prefijo `/api/v1`. Probar autenticación y respuestas representativas; servir YAML no demuestra conformidad. Definir exclusiones explícitas de rutas auxiliares de Swagger.
3. **`docs/api_layer_decisions.md`:** añadir secciones ligeras para ancla `resumedAt`, tasas a USD, periodicidad, redondeo, semántica de analytics, migración PAUSED y límites del timeline. Separar ADRs cuando el archivo deje de ser manejable.

Cambios breaking requieren major y transición anunciada: marcar operaciones/campos reemplazados con `deprecated: true` durante al menos una versión menor antes de eliminarlos; explicar reemplazo y calendario en changelog. Clasificar cambios semánticos de cálculos además de cambios de forma JSON.

**Regla de terminado:** código y nivel de documentación correspondiente se revisan en el mismo PR. Actualizar `backend_todo.md` según evidencia: distinguir implementado de verificado y sustituir la antigua decisión SM-143. No marcar pendientes como hechos por haberlos incluido aquí.

**Alternativas descartadas:** solo changelog no define contrato; solo OpenAPI no explica arquitectura; un ADR por ajuste menor dificulta consulta. **Aceptación:** release, contrato y decisiones describen el mismo comportamiento comprobado.

## Fuera del hito

Documentar en `backend_todo.md` como siguiente iteración: SM-144 (historial de estados y timeline por intervalos activos), rate limiting Redis para múltiples instancias, cambio de moneda primaria, verificación de email y métricas/tracing. El límite en memoria exige reconocer su alcance por instancia; no prometer un límite global. Request logs y health sí forman parte del cierre.

## Riesgos y puertas de salida

| Riesgo | Mitigación / evidencia exigida |
|---|---|
| Estados ya eliminados | Inventario de migraciones y backup/auditoría; no inferir estados perdidos desde el default. |
| Tasas invertidas en DB | Payload de proveedor controlado, prueba masiva/puntual y recarga de datos antes de habilitar cálculos. |
| Falsa igualdad entre endpoints | Documentar unidad temporal y trial; oráculos separados y reconciliación solo sobre magnitudes equivalentes. |
| Redondeo y floats | Redondear en frontera, constantes esperadas con tolerancia solo interna; no sumar valores ya redondeados para anualizar. |
| SWR genera tormenta de requests | Deduplicación por moneda, timeout y pruebas con proveedor caído. |
| Migración no probada por integración | Gate separado que aplica SQL histórico; `db push` no es sustituto. |
| Tests dependientes del reloj | Reloj fijo para Date/Temporal, bordes de calendario y fixtures aislados. |
| Imagen difiere del entorno de tests | Smoke sobre imagen final, docs habilitadas, migración con CLI disponible y PORT alternativo. |
| Cobertura alta sin exactitud | Revisar derivaciones financieras manuales y transiciones E2E además del 100%. |

Puertas de salida del hito:

- [ ] SM-143 y cadena de migraciones preservan los datos, con prueba y recuperación documentadas.
- [ ] Dashboard usa tasas persistidas correctas y analytics elimina N+1 de monedas.
- [ ] Frecuencia, conversión, trials y estados pasan oráculos independientes.
- [ ] Fixtures, reconciliación y E2E verifican la historia del usuario dentro de los límites de v1.
- [ ] npm test descubre todos los tests previstos; cobertura financiera cumple el gate por archivo.
- [ ] CI e imagen final pasan; health, logging, configuración y checklist están ensayados.
- [ ] OpenAPI, decisiones, backlog y CHANGELOG acompañan la versión real a publicar.

Guardar con la release el SHA, resultados de CI, reporte de cobertura, conteos pre/post migración, resultado de restauración y smoke de imagen. Solo entonces el hito puede declararse listo para deploy.
