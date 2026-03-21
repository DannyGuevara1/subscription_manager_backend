# Convención de Nomenclatura

Esta convención asegura nombres claros, predecibles y consistentes en todo el código.

## 1. Archivos
- Controladores: `*.controller.ts`
- Servicios: `*.service.ts`
- DTOs: `*.dto.ts`
- Tipos/Interfaces: `*.type.ts`
- Middlewares: `*.middleware.ts`

## 2. Variables y Funciones
- camelCase para variables, funciones y métodos.
- Prefijos claros para funciones asíncronas: `get`, `create`, `update`, `delete`.

## 2.1 Métodos de servicio: internos vs endpoint
- Métodos internos (sin reglas de autorización por requester) deben terminar en `Internal`.
	- Ejemplo: `getUserByIdInternal`.
- Métodos usados por controladores para endpoints protegidos deben reflejar intención de acceso y requerir contexto autenticado.
	- Ejemplo: `getUserProfileById(id, authUser)`.
- Evitar firmas ambiguas con parámetros opcionales de autorización en un mismo método de servicio.
	- Preferir separar responsabilidades en métodos distintos (interno vs endpoint).

## 3. Clases y Tipos
- PascalCase para clases, interfaces y tipos.
- Reservar el prefijo `Safe*` para DTOs de salida/sanitización en la frontera HTTP (`*.dto.ts`).
- En `*.type.ts` usar nombres de dominio neutrales (ej: `AuthUser`, `SubscriptionDomain`).

## 4. Constantes
- MAYÚSCULAS_CON_GUIONES para valores inmutables globales.

## 4.1 Enums/Literales compartidos de dominio
- Definir y reutilizar enums/literales en `src/shared/types/domain.enums.ts`.
- Para Zod, preferir `z.enum(ROLE_VALUES)` (y equivalentes) en vez de reconstruir enums localmente.

## 5. Rutas y Endpoints
- Usar nombres en minúsculas y separados por guiones: `/user-profile`, `/auth/login`.

---

Seguir esta convención facilita la colaboración y el mantenimiento del proyecto.