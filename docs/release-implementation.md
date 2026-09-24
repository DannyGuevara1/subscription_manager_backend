# Cierre de release: decisiones, implementación y evidencia

Revisión iniciada el 2026-09-23 sobre `ac16e4b`. Este documento explica los cambios del [plan](plan-v1-release.md). El trabajo prepara una publicación; no ejecuta un deploy ni certifica datos de una base de clientes a la que no tenemos acceso.

## 1. Primero definir qué representa cada número

Una suscripción tiene un **importe por cobro** y un **intervalo entre cobros**. USD 24 cada dos años no significa USD 48 por año: representa USD 12 por año o USD 1 mensual. El normalizador multiplicaba el costo por la frecuencia; ahora divide. Después aplica la equivalencia de la unidad: 365/12 días, 52/12 semanas, 1 mes o 1/12 años.

Se conserva la distinción entre presupuesto corriente y proyectado. Mientras un trial está vigente, el corriente es cero y el proyectado incluye el importe registrado. VARIABLE es una estimación con el último importe registrado, no un consumo medido. Los servicios de suscripciones seleccionan únicamente ACTIVE antes de agregar; la responsabilidad de normalizar no incluye consultar ni filtrar estados.

El redondeo ocurre al serializar el total, nunca antes de sumar ni antes de anualizar. Por ejemplo, el familiar de USD 199.99 al año equivale internamente a 16.665833… mensuales. Multiplicar el mensual ya redondeado (16.67) por 12 produciría 200.04, cinco centavos inventados.

**Dónde:** `subscription-cost-normalizer.service.ts` y `tests/fixtures/financial.ts`. Los tests congelan valores literales con derivación visible; no llaman al código productivo para calcular lo que esperan.

## 2. La moneda tiene unidades, igual que una distancia

`exchangeRateToUSD` debe significar **USD por una unidad de moneda**. El endpoint del proveedor devuelve unidades de moneda por una unidad de su base USD. Si informa EUR=0.8, se guarda 1/0.8=1.25 USD/EUR. El método puntual ya usaba el cociente adecuado; el refresco masivo guardaba el valor invertido.

Corregí esa frontera en `ExchangeRateService.updateAllRates`, manteniendo el contrato del puerto bulk como cotizaciones base USD. El adapter comprueba base USD, cotización USD=1 y valores positivos finitos; el fetch tiene límite de cinco segundos. El servicio también valida tasas persistidas y respuestas puntuales: una tasa inválida nunca se sustituye por 1.

Para EUR→GBP, los USD se cancelan: EUR 25 × 1.08 USD/EUR ÷ 1.25 USD/GBP = GBP 21.60. Mantener una sola referencia evita tablas separadas por cada par de monedas.

Las tasas antiguas pueden seguir siendo válidas como último dato conocido. Una consulta devuelve ese dato y refresca en segundo plano al alcanzar 24 horas. Un mapa de promesas comparte cada refresco pendiente por moneda dentro del proceso. La deduplicación es local, no una coordinación entre réplicas. El cron especifica UTC explícitamente.

**Fuentes consultadas:** [contrato oficial de OpenExchangeRates](https://docs.openexchangerates.org/reference/latest-json). Context7 no estaba disponible en esta sesión; se consultó directamente documentación primaria.

## 3. Un dashboard no debe esperar una llamada HTTP por suscripción

El normalizador ahora recibe `ExchangeRateService` y obtiene todas las tasas necesarias una vez por cálculo. `CurrencyRepository.findByCodes` hace una consulta con códigos únicos; analytics reutiliza el mismo mecanismo. La moneda primaria está incluida aunque ninguna suscripción la utilice. USD=1 se resuelve localmente.

Esto elimina dos causas diferentes de latencia: HTTP repetido en dashboard y N lecturas SQL en analytics. No bastaba usar `Promise.all`: habría seguido ejecutando N consultas. Tampoco hacía falta añadir Redis para las tasas, porque la caché persistida ya existía.

Awilix resuelve los servicios con inyección CLASSIC por nombre de parámetro. El cambio se hizo en el constructor del normalizador y en sus dobles de test; la carga automática existente registra `exchangeRateService`. La integración y la imagen final verifican esa resolución real.

La disponibilidad tiene un límite deliberado: una tasa almacenada válida permite responder durante una caída del proveedor; sin tasa válida no se inventa un resultado financiero. Antes de servir tráfico, `npm run rates:refresh` inicializa USD/EUR y refresca las monedas existentes en una transacción, sin crear usuarios ni ejecutar el seed de demostración. También repara la dirección de cotización de datos antiguos. Si una moneda no tiene cotización válida, aborta sin cambios.

## 4. Analytics y dashboard responden preguntas diferentes

El dashboard muestra equivalentes mensuales/anuales. Analytics conserva el importe por cobro agrupado por categoría. Cambiar esa semántica sin avisar sería una modificación del contrato, aunque la respuesta conservara la misma forma JSON.

El portafolio compartido produce USD **142.93** mensuales proyectados, **132.93** corrientes y **309.25** como suma de importes por cobro. Esas cantidades son compatibles: la segunda agregación incluye 199.99 del plan anual en vez de 199.99/12, 12 del semanal en vez de 52 mensuales y el resto de intervalos sin normalización. Los oráculos describen esa diferencia, en lugar de imponer una igualdad falsa.

Se detectó un error adicional en el filtro: Zod producía booleanos, pero el servicio comparaba contra `ACTIVE/PAUSED/CANCELLED`. Se normalizan `true → ACTIVE` y `false → PAUSED`, y se aceptan estados explícitos. Los booleanos se documentan como compatibilidad deprecada; no se eliminan en esta versión. Como la fuente es la colección activa, PAUSED/CANCELLED devuelven vacío.

## 5. Preservar datos antes de eliminar una columna

La corrección de SM-143 es **aditiva**: un paso inmediatamente anterior guarda IDs y `isActive` en una tabla transitoria; después del SQL histórico que elimina el booleano, otro paso restaura `ACTIVE/PAUSED` y elimina esa tabla. Cada paso nuevo es transaccional. Si falla el paso intermedio, el respaldo transitorio sigue disponible: no abrir tráfico hasta completar toda la cadena. La decisión es `false → PAUSED`, sustituyendo la antigua propuesta de cancelación terminal.

¿Por qué no reescribir el SQL original? Además de sus permisos de archivo, desconocemos dónde se aplicó. Conservarlo mantiene su checksum y hace explícita la reparación. Los nombres de los pasos nuevos los colocan antes/después del cambio histórico cuando se despliega una base anterior o nueva. No se deben ordenar estos archivos por fecha de creación del archivo: Prisma usa los nombres de migración.

Antes del reemplazo histórico del enum, un paso nuevo usa `ALTER TYPE ... RENAME VALUE` para convertir `CANCELED` en `CANCELLED` sin perder filas. El cast posterior recibe entonces valores que sí existen en el enum destino.

Una base que ya ejecutó el DROP y contiene suscripciones requiere una evaluación distinta. El paso de preservación detecta esa situación y **aborta en lugar de fabricar estados**. Una columna eliminada no puede recuperarse con SQL posterior. El [checklist](deploy-checklist.md) exige recuperar/verificar estados desde una fuente externa y preparar una reconciliación específica antes de adoptar los pasos añadidos. No se borran entradas ni se sustituyen checksums para forzar el deploy. Una base ya migrada y vacía puede aplicar los pasos sin inventar datos.

La prueba dedicada crea PostgreSQL, aplica las migraciones anteriores, inserta el portafolio en formato legado, ejecuta las posteriores y compara datos por ID. Además comprueba idempotencia del deploy, conversión de CANCELED y restauración de un `pg_dump` anterior. Son datos sintéticos representativos, no una copia de producción.

### Precisión de almacenamiento

Las tasas pasan de cuatro a diez decimales para reducir el riesgo de redondear una cotización pequeña a cero. Esto no recupera precisión histórica ya perdida: el refresco previo al tráfico sigue siendo necesario. Los cálculos de aplicación continúan usando `number`; no se afirma exactitud decimal arbitraria ni equivalencia contable con un libro mayor.

Durante la revisión inicial parecía faltar la conversión de costo de float a decimal. Al comprobar la cadena completa se verificó que `20260418035558` ya la realiza: se retiró la conversión redundante antes del cierre. Este contraste ilustra por qué un diagnóstico sobre la primera migración no sustituye a ejecutar y revisar toda la cadena.

## 6. Fechas, trial y reanudación

Al probar trials más largos que un período apareció otro defecto: la proyección empezaba en el fin del trial, pero los siguientes pasos volvían a sumarse sobre la fecha original. Podía producir una secuencia que retrocedía y cargos dentro del trial. Ahora el ancla de cálculo es la fecha posterior entre inicio y fin de trial, y todos los períodos se suman a esa misma ancla.

Sumar cada período a la fecha original también conserva el fin de mes: 31 enero → 29 febrero de 2024 → 31 marzo, sin acumular el recorte de febrero.

El dashboard sigue pasando `resumedAt` como ancla efectiva al reanudar. El timeline conserva el contrato desde el inicio/trial y excluye suscripciones actualmente pausadas/canceladas. **No reconstruye huecos históricos ni acredita pagos realizados.** Para eso hace falta SM-144, que permanece fuera del hito.

## 7. Pruebas que cuentan una historia y scripts que realmente las ejecutan

El escenario HTTP registra un usuario, inicia sesión con cookies, crea categorías y el portafolio, comprueba los números manuales, pausa, reanuda y cancela. Verifica el nuevo ancla, la terminalidad de CANCELLED y que otro usuario no vea los montos. Las tasas son controladas; PostgreSQL y Redis son reales.

El descubrimiento de tests ahora recorre directorios con Node. Así incluye el health test que está directamente en `tests/integration/`, sin depender de cómo cada shell expanda `**`. Los grupos tienen scripts separados; `npm test` ejecuta unitarios, integración y migraciones. La concurrencia entre archivos es uno para acotar recursos de Testcontainers.

c8 usa la cobertura V8 de Node y aplica **100% por archivo** a líneas, ramas, funciones y sentencias de los cuatro servicios financieros. Incluye archivos no cargados y produce HTML, LCOV y JSON. El porcentaje no sustituye los oráculos: ambos son requisitos independientes. No se agregaron exclusiones de ramas financieras. [Documentación de c8](https://github.com/bcoe/c8).

El setup de integración usa `migrate deploy` en lugar de `db push`. Esto hace visibles diferencias entre schema y SQL; la prueba de migración con datos anteriores complementa la creación desde cero.

## 8. Operar y desplegar con evidencia

- **Liveness `/health`:** el proceso responde. **Readiness `/ready`:** PostgreSQL y Redis contestan dentro de 1.5 segundos; responde 503 RFC 9457 si fallan. El proveedor FX no participa. Los probes se comparten mientras hay trabajo pendiente y las rutas de salud se excluyen del limitador global para no convertir probes frecuentes en falsos fallos.
- **Logging:** cada request recibe un ID generado por servidor, status y duración. Se registra la plantilla de ruta, no la URL con queries ni cuerpos/cookies. `finish` y `close` comparten una guarda para evitar dos eventos. Los errores correlacionados omiten valores de validación que podrían contener contraseñas.
- **Configuración:** `.env.example` enumera variables reales y placeholders. La carga de dotenv precede a módulos que leen el entorno. Redis no acumula comandos nuevos mientras está desconectado. En infraestructura con proxy debe configurarse la confianza según la topología; no se confía indiscriminadamente en headers del cliente.
- **Imagen:** incluye el YAML, compila solo código de aplicación, conserva usuario no root y usa PORT configurable en healthcheck. La etapa `migration` contiene la versión fijada del CLI; no descarga herramientas al iniciar réplicas.
- **Cierre:** deja de aceptar HTTP, drena requests, detiene cron, desconecta dependencias y mantiene un límite de 30 segundos. Destruir Redis tras el drenaje también termina su reconexión si el servidor de caché está caído.
- **Smoke de imagen:** PostgreSQL/Redis efímeros, puerto alternativo, cookies secure/httpOnly, docs autenticadas, refresh, summary, caída de Redis, liveness y SIGTERM. No usa credenciales reales del proveedor.
- **CI:** instalación reproducible, generación Prisma, typecheck, build, cobertura, integración, migraciones, imagen y smoke; publica coverage incluso si falla otro paso. El workflow queda preparado; su ejecución remota ocurre al subir los cambios.

## 9. Documentación como parte del cambio

OpenAPI incluye readiness y las semánticas financieras. Su test valida el documento y compara métodos/rutas con los routers instanciados, incluidos los montajes. Swagger está excluido de esa comparación como infraestructura de documentación, no como endpoint de negocio.

CHANGELOG registra los cambios nuevos en Unreleased y documenta retrospectivamente la base `1.1.0` sin inventar una fecha de publicación. El package no se rebaja a `1.0.0`: ese nombre describe el hito. Las decisiones duraderas se agregan a `api_layer_decisions.md` y el backlog distingue límites pendientes de funcionalidades existentes.

## 10. Validación final

Los resultados definitivos de build, tipos, suites, cobertura, migración/restauración e imagen se registran al terminar la ejecución. No confundir pruebas locales con despliegue ni con ensayo sobre datos reales de clientes. Consultar también las puertas pendientes del checklist antes de promover una imagen.
