# Types vs DTOs en Arquitectura de Software

Este documento aclara la separación de responsabilidades entre archivos `*.type.ts` y `*.dto.ts` en nuestro proyecto. Esta distinción es fundamental para mantener una arquitectura limpia y desacoplada.

## Resumen Rápido

| Característica | DTO (`*.dto.ts`) | Type / Interface (`*.type.ts`) |
| :--- | :--- | :--- |
| **Capa Principal** | **Externa** (Controller / API) | **Interna** (Repository / Domain) |
| **Propósito** | Validar entrada/salida HTTP. Proteger la API. | Definir contratos internos de datos y entidades. |
| **Tecnología** | Usualmente **Zod** (Validación en Runtime). | **TypeScript Interfaces** (Solo compilación). |
| **Origen de Datos** | `req.body`, JSON externo. | Base de datos, argumentos de funciones internas. |
| **Ejemplo** | `RegisterDto`, `LoginDto` | `CreateUserData`, `AuthUser` |

---

## 1. DTOs (Data Transfer Objects)
**"La puerta de entrada y salida"**

Los DTOs en nuestro proyecto están fuertemente ligados a la **validación**. Como usamos Zod, nuestros DTOs no son solo interfaces, son esquemas que se ejecutan en tiempo de ejecución para asegurar que los datos externos son seguros.

**Cuándo usarlos:**
*   En los **Controladores**: Para recibir `req.body`.
*   En los **Servicios (Entrada)**: Como argumento público de los métodos del servicio (ej: `register(data: RegisterDto)`).
*   En los **Servicios (Salida)**: Para retornar datos limpios al cliente (ej: `SafeUserDto`).

**Por qué:**
El DTO garantiza que si un dato llega a tu servicio, **ya es válido**.

---

## 2. Types / Interfaces
**"El lenguaje interno del sistema"**

Los archivos `*.type.ts` definen las estructuras de datos puras que usa tu aplicación internamente. No tienen validación de runtime (Zod), son contratos estrictos de TypeScript para que el compilador te ayude.

**Caso de Uso Principal: Repositorios (Repository Pattern)**

Tus repositorios (`UserRepository`, `CategoryRepository`) interactúan con la base de datos (Prisma).
*   Un repositorio **NO** debería depender de un DTO de la API. ¿Por qué?
    *   Porque la base de datos no siempre necesita lo mismo que la API.
    *   Porque podrías querer reusar tu repositorio en un script de consola o un cron job donde no hay HTTP ni "LoginDto".

**Ejemplo Real del Proyecto:**

En `category.repository.ts`, el método `create` recibe `CreateCategoryData`.
```typescript
// src/modules/category/category.type.ts
export interface CreateCategoryData {
    userId: string;
    name: string;
}
```

Esto es correcto porque:
1.  Es una interfaz pura de TypeScript.
2.  Define exactamente qué campos necesita Prisma para crear el registro.
3.  Desacopla el repositorio de la capa HTTP. Si mañana cambias el endpoint de login, tu repositorio no se entera.

---

## 3. El Flujo de Transformación

Es normal que los datos cambien de forma a medida que profundizan en las capas:

1.  **Mundo Exterior** (JSON inseguro)
    ⬇️ *Validación (Zod)*
2.  **Controller** (Tiene un `RegisterDto`)
    ⬇️ *Pasa el DTO*
3.  **Service** (Recibe `RegisterDto`)
    🔄 *Lógica de Negocio (Hashear password, generar IDs)*
    ⬇️ *Transforma a Data Interna*
4.  **Repository** (Recibe `CreateUserData` interface)
    ⬇️ *Prisma Client*
5.  **Base de Datos**

## Conclusión

*   Mantén tus **DTOs** en `*.dto.ts` para todo lo que toque la frontera del sistema (API).
*   Mantén tus **Interfaces** en `*.type.ts` para contratos internos, especialmente para los argumentos de tus Repositorios.

---

## 4. Convenciones adicionales del proyecto

### 4.1 Enums de dominio (fuente única)

Para evitar inconsistencias de tipos entre módulos, los enums/literales de dominio deben salir de una sola fuente compartida:

*   `src/shared/types/domain.enums.ts`

Ejemplo recomendado:

```typescript
export const ROLE_VALUES = ['USER', 'ADMIN', 'SUPPORT'] as const;
export type Role = (typeof ROLE_VALUES)[number];
```

Uso esperado:

*   En `*.type.ts`: usar `Role` como contrato interno.
*   En `*.dto.ts`: usar `z.enum(ROLE_VALUES)` para que Zod y TypeScript queden alineados.

### 4.2 Regla de naming para `Safe*`

El prefijo `Safe*` se reserva para datos de salida validados/sanitizados en la frontera de API (DTOs).

*   ✅ Correcto: `SafeUserDto`, `SafeSubscriptionDto` en `*.dto.ts`.
*   ❌ Evitar: `Safe*` en `*.type.ts` para contratos internos de repositorio/dominio.

Para contratos internos, usar nombres neutrales de dominio, por ejemplo:

*   `AuthUser`
*   `SubscriptionDomain`

Esta separación te da una arquitectura **Profesional**, **Escalable** y **Testeable**.
