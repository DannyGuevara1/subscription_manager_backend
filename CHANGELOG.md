# Changelog

Cambios relevantes para consumidores y operadores. Convención: Keep a Changelog y SemVer. El hito «cierre v1.0» no rebaja la versión `1.1.0` existente. La siguiente versión y fecha se fijan al publicar.

## [Unreleased]

### Added

- Readiness `/api/v1/ready` con PostgreSQL/Redis, timeout y error RFC 9457.
- Request ID y logging estructurado de duración/status sin cuerpos, tokens ni URL con query.
- Fixtures financieros, oráculos independientes, recorrido HTTP completo y reconciliación entre endpoints.
- Pruebas de migración con datos legados, restauración, bloqueo de estados irrecuperables y smoke de imagen.
- Scripts separados, cobertura c8 al 100% por servicio financiero y GitHub Actions.
- Etapa Docker de migración, `.env.example`, inicialización transaccional de tasas y checklist operativo.

### Changed

- Dashboard y analytics leen una instantánea por lote de tasas persistidas; SWR comparte refrescos pendientes por moneda.
- Tests de integración ejecutan migraciones reales en lugar de `db push`.
- Precisión de tasas ampliada a DECIMAL(20,10) para conservar cotizaciones pequeñas.
- Analytics acepta filtros de estado explícitos; booleanos legacy siguen funcionando y se documentan como deprecados.
- La imagen incluye OpenAPI y respeta PORT en el healthcheck; cierre tolera Redis desconectado.

### Fixed

- Intervalos de facturación mayores que uno: dividir costo por frecuencia. USD 24 cada dos años ahora produce USD 1 mensual.
- Refresco masivo FX: cotizaciones base USD se invierten antes de persistir como USD por unidad. Es obligatorio refrescar datos antiguos antes de servir tráfico.
- Proyecciones con trials largos ya no retroceden a cargos dentro del trial.
- Pasos aditivos preservan `isActive → ACTIVE/PAUSED` y `CANCELED → CANCELLED` alrededor de los SQL históricos, sin cambiar sus checksums. Una base no vacía que ya perdió el booleano bloquea el deploy hasta recuperar/auditar sus estados.
- Analytics traduce filtros booleanos antes de comparar con el enum de dominio.
- Descubrimiento de tests incluye archivos directamente bajo `tests/integration`.

### Removed

- Dependencia de llamadas HTTP externas por suscripción al abrir el summary.
- Descarga implícita de rimraf en build; limpieza con Node sobre `dist`.

## [1.1.0] — retrospectiva de la base existente

Fecha de publicación no verificada: no hay tag local de release. Inventario revisado el 2026-09-23 sobre `ac16e4b`; esta fecha no se presenta como fecha histórica de publicación.

### Added

- API modular de usuarios, categorías, monedas y suscripciones; auth con cookies, refresh rotation y detección de reuso.
- Dashboard, analytics, job de tasas, OpenAPI 3.1 y tests con Testcontainers.
- Estados ACTIVE/PAUSED/CANCELLED y ancla `resumedAt`; cancelación terminal.
- Validación Zod, errores estructurados, rate limiting y Docker multistage.
