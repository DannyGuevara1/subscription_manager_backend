# Checklist de despliegue y recuperación

Aplicable a una única instancia inicial. No ejecutar contra producción sin identificar explícitamente el entorno. Las pruebas automáticas usan contenedores efímeros; no validan por sí solas los datos de clientes.

## Antes de publicar

- [ ] Revisar el informe `release-implementation.md` y los resultados de CI del SHA exacto.
- [ ] Consultar `_prisma_migrations` en cada entorno. Los SQL históricos permanecen intactos; los pasos nuevos de preservación se insertan alrededor de ellos. Si la base ya perdió `isActive` y tiene filas, el guard abortará. Recuperar/auditar estados desde backup y preparar un procedimiento específico de reconciliación de los pasos nuevos antes de continuar; no borrar registros de migración ni falsificar checksums.
- [ ] Con datos previos: comprobar conteos de `isActive`, costos, monedas y relaciones. Los inactivos pasarán a PAUSED. Si el booleano ya se perdió, recuperar la información desde backup/auditoría; no inferirla del default ACTIVE.
- [ ] Si se parte de una base anterior a abril de 2026, revisar costos antes de su conversión histórica a DECIMAL(10,2); no permitir redondeo silencioso de datos legados sin evaluación.
- [ ] Crear backup y restaurarlo en una base aislada. Ensayar allí la cadena completa, comparar estados por ID y medir duración/bloqueos. Adjuntar conteos y resultado al release.
- [ ] Generar imagen inmutable y conservar la imagen anterior. Ejecutar `npm ci`, `npm run db:generate`, `npm run check`, `npm run build`, `npm run test:coverage`, `npm run test:integration`, `npm run test:migrations`, `npm run image:build`, `npm run test:smoke`.

## Configuración de plataforma

- [ ] Inyectar las variables de `.env.example`; usar secretos JWT diferentes y aleatorios. No incluir `.env` ni credenciales en imagen/logs.
- [ ] PostgreSQL y Redis privados, límites de conexión y timeouts definidos; persistencia/recuperación de Redis coherente con sesiones de refresh.
- [ ] HTTPS, cookies secure/httpOnly, CORS con orígenes exactos y credenciales. Probar login/refresh desde el origen real del frontend.
- [ ] Si hay proxy, configurar Express `trust proxy` con la topología efectiva y probar la IP del rate limiter. No habilitar confianza global sin verificar quién puede llegar al backend.
- [ ] Una réplica en esta versión: rate limiting y deduplicación de refrescos son por proceso. Coordinar el cron antes de ampliar réplicas.
- [ ] Liveness: `/api/v1/health`; readiness: `/api/v1/ready`. El segundo puede tardar hasta 1.5 s. Las rutas no exponen detalles de conexión.
- [ ] Grace period del orquestador mayor que 30 segundos. Docs deshabilitadas por defecto en producción; si se habilitan, siguen requiriendo autenticación.

## Secuencia de release

1. Pausar escrituras/tráfico según la ventana ensayada. Comprobar backup restaurable.
2. Construir etapa de migración: `docker build --target migration -t subscription-manager:migration .`. Ejecutarla una sola vez como job con DATABASE_URL inyectada; el comando predeterminado es `prisma migrate deploy` con CLI local fijado. No ejecutarlo desde cada réplica.
3. Ejecutar `npm run rates:refresh` dentro de la imagen de aplicación con DATABASE_URL y APP_ID_OPENEXCHANGERATES inyectados. Inicializa USD/EUR y refresca todas las monedas existentes transaccionalmente. No ejecutar `db:seed`: borra datos y crea usuarios de demostración.
4. Arrancar el SHA/imagen verificado y esperar readiness. Comprobar una tasa no USD contra el proveedor en dirección USD por unidad, especialmente si había tasas antiguas.
5. Smoke autorizado con cuenta de prueba: login/refresh, summary, analytics, estado de suscripciones y docs si están habilitadas. Comparar un importe conocido. Verificar logs sin tokens y request IDs.
6. Abrir tráfico y observar errores, latencias, cuotas y cron. Archivar digest, SHA, evidencia, responsables y hora.

## Si falla

- Fallo de migración: detener el avance, inspeccionar causa y transacción. No usar `db push`, `migrate reset` ni resolver como aplicada una migración que no lo está.
- Fallo del proveedor al inicializar tasas: no abrir tráfico con cotizaciones de dirección desconocida. El job aborta y no confirma cambios parciales.
- Fallo de aplicación con schema compatible: volver a la imagen anterior verificada.
- Fallo con schema incompatible/pérdida de datos: restaurar backup en una base nueva, validar conteos y apuntar la aplicación compatible a ella. El rollback de imagen no restaura columnas eliminadas. Registrar también cómo se tratarán escrituras posteriores al backup.
- Readiness falla pero liveness responde: investigar dependencias; no reiniciar en bucle por una caída externa de FX.

## Evidencia que no automatiza este repositorio

- [ ] Historial real de migraciones compartidas revisado.
- [ ] Copia anonimizada de datos reales migrada y backup real restaurado.
- [ ] Configuración de HTTPS, proxy, secretos, permisos y recursos de la plataforma comprobada.
- [ ] CI remoto del commit final aprobado y promoción de imagen autorizada.
