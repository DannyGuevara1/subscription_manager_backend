# Backend — estado y backlog

Estado revisado durante el cierre de release. Diagnóstico original: [plan](docs/plan-v1-release.md). Cambios y evidencia: [implementación](docs/release-implementation.md). No confundir código implementado con promoción a producción.

## Implementado en este cierre

- [x] Dashboard consume tasas persistidas por lote; frecuencia divide el costo por intervalo.
- [x] Analytics elimina N+1 de tasas y mantiene la semántica por cobro documentada.
- [x] Refresco masivo FX persiste USD por unidad, validación y timeout, SWR deduplicado y cron UTC.
- [x] SM-143: pasos aditivos preservan inactivos como PAUSED y preparan el renombrado del enum; históricos intactos.
- [x] Fixtures compartidos, oráculos y E2E de registro → creación → pausa → reanudación → cancelación.
- [x] Scripts unit/integration/migrations, cobertura financiera por archivo y CI.
- [x] Readiness, request logging, ejemplo de configuración, imagen y checklist de despliegue.
- [x] Contrato OpenAPI validado contra routers, CHANGELOG y decisiones documentadas.

## Puertas operativas pendientes del primer deploy

- [ ] Verificar `_prisma_migrations` de cada entorno. Si ya se perdió isActive con datos, resolver la recuperación/auditoría antes de aplicar el guard aditivo. No se reconstruyen estados desde defaults.
- [ ] Ensayar migración y restauración sobre una copia anonimizada representativa de datos reales. Los tests incluidos usan fixtures sintéticos.
- [ ] Inicializar/refrescar tasas con el job explícito antes de tráfico; no usar seed de demo.
- [ ] Confirmar CI remoto y smoke del SHA a publicar, secretos, HTTPS, CORS y configuración de proxy de la plataforma.
- [ ] Medir carga representativa y confirmar objetivo de dashboard menor de 2 segundos bajo recursos/concurrencia definidos. Contar queries no sustituye una prueba de capacidad.

## Posterior al hito («v1.1» funcional; versión SemVer por definir)

### SM-144 — Historial de estados y timeline por intervalos activos

`resumedAt` solo conserva la última reanudación. No guarda todas las pausas ni permite reconstruir pagos históricos. El timeline actual es una proyección contractual, no evidencia de cargos realizados.

Añadir `SubscriptionStatusHistory(subscriptionId, status, changedAt)` y escribir cada transición dentro de la misma transacción que el estado. Proyectar solo en intervalos activos; conservar CANCELLED terminal. Verificar múltiples pausas/reanudaciones, cambios de período y correcciones accidentales. El dashboard puede mantener `resumedAt` como ancla denormalizada.

### Otros pendientes explícitos

- Rate limiting Redis y coordinación de refrescos/cron para múltiples instancias.
- Cambio de moneda primaria del usuario con estrategia de actualización de sesiones y semántica financiera.
- Verificación de email.
- Métricas y tracing distribuidos. Los logs y health de este cierre no los sustituyen.
