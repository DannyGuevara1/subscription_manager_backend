

Análisis de Requisitos

1. Análisis de requisitos

Esta sección define el qué: qué hará la aplicación, para quién y bajo qué condiciones.

1.1. Resumen del Proyecto
"Subscription Manager" es una aplicación web diseñada para que los usuarios puedan registrar, gestionar y analizar sus gastos de suscripciones recurrentes. El sistema proporcionará una visión financiera clara, manejará múltiples monedas y alertará proactivamente sobre cobros importantes para ayudar a los usuarios a tener un mejor control de sus finanzas.

1.2. Actores (Roles de Usuario)
 * Usuario Registrado: Cualquier persona que se registra para gestionar sus suscripciones personales. Tiene control total y privado sobre sus propios datos.

1.3. Requisitos Funcionales (RF)
Se detallan las funcionalidades específicas que el sistema debe ejecutar, agrupadas por área.

RF-A: Gestión de Usuarios y Autenticación
- [x] RF-001: El sistema debe permitir a un nuevo usuario registrarse proporcionando su nombre, correo electrónico y una contraseña.
- [x] RF-002: El sistema debe permitir a un usuario existente iniciar sesión con su correo electrónico y contraseña.
- [🟡] RF-003: El sistema debe proteger las rutas para que solo los usuarios autenticados puedan acceder al panel de control y a la gestión de suscripciones. (autenticación y autorización ya están implementadas en las rutas existentes, pero el dashboard todavía no existe)
- [x] RF-004: Perfil de usuario donde se puede cambiar la contraseña y definir una moneda principal (ej. USD, EUR) para la visualización de reportes consolidados.
- [x] RF-005: El sistema debe permitir al usuario cerrar su sesión de forma segura.


RF-B: Panel de Control (Dashboard)
- RF-006: Al iniciar sesión, el sistema debe mostrar un resumen con el cálculo del gasto total mensual y el gasto total anual, basado en las suscripciones activas convirtiendo todos los costos a la moneda principal del usuario.
- RF-007: El panel debe mostrar una lista de las 3 a 5 próximas renovaciones de suscripciones, ordenadas por la fecha más cercana priorizando las suscripciones cuyo periodo de prueba está por finalizar.
- RF-008: El panel debe mostrar una lista general de todas las suscripciones activas del usuario.
- RF-009: El sistema debe generar una alerta visible en la UI para los cobros que ocurrirán en los próximos 7 días.
RF-C: Gestión de Suscripciones (CRUD)



[x] RF-010: El formulario para añadir/editar una suscripción deberá capturar:

Nombre del servicio (texto).
Costo (numérico).
Moneda (seleccionable, ej. USD, EUR, MXN).
Tipo de Costo (seleccionable: 'Fijo', 'Variable'). Si es variable, el costo introducido se considerará un promedio o estimación.
Ciclo de Facturación, compuesto por:
Frecuencia (número, ej. "1").
Unidad de tiempo (seleccionable: 'meses', 'años', 'días').
Fecha del primer pago (selector de fecha).
Fecha de fin del periodo de prueba (opcional, selector de fecha).
Categoría (seleccionable y personalizable por el usuario).
- [x] RF-011: El usuario debe poder ver los detalles completos de una suscripción existente.
- [x] RF-012: El usuario debe poder editar cualquiera de los campos de una suscripción previamente creada.
- [x] RF-013: El usuario debe poder eliminar permanentemente una suscripción de su lista.

RF-D: Análisis y Reportes

- RF-014: El sistema debe mostrar un gráfico (de pastel o barras) que represente el desglose de gastos por categoría.
- RF-015: El sistema debe ser capaz de filtrar la lista de suscripciones visibles por categoría y/o por ciclo de facturación.
- RF-016: El sistema debe mostrar una vista con el historial de pagos pasados y futuros, proyectados a partir de la fecha de inicio y el ciclo de facturación.

RF-E: Confianza y Transparencia

- RF-017: Debe existir una página pública de "Política de Privacidad" que explique de forma clara qué datos se almacenan y cómo se protegen.

1.4. Requisitos No Funcionales (RNF)
Definen las cualidades del sistema y cómo debe operar.

- RNF-01 (Seguridad): Hash de contraseñas (Argon2 o bcrypt). Políticas de `Content-Security-Policy` para prevenir ataques XSS. Uso de HTTPS en todo el sitio (falta https).
- RNF-02 (Rendimiento): El cálculo de los totales en el dashboard y la carga de la lista de suscripciones debe completarse en menos de 2 segundos.
- RNF-03 (Fiabilidad de Datos): La conversión de divisas debe actualizarse periódicamente (ej. cada 24 horas) para asegurar la precisión de los reportes.
- RNF-04 (Usabilidad): La interfaz debe ser limpia, intuitiva y fácil de usar. Un usuario nuevo debería poder añadir su primera suscripción sin necesidad de un tutorial.
- RNF-05 (Compatibilidad): La aplicación web debe ser compatible y funcionar correctamente en las últimas versiones de los navegadores web modernos (Chrome, Firefox, Safari, Edge).
