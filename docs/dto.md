# Objetos de Transferencia de Datos (DTO) y Schemas de Validación

Este documento explica la arquitectura de manejo de datos implementada en el proyecto, siguiendo las mejores prácticas de desarrollo backend profesional.

## 1. Diferencia Conceptual

Es común confundir "Validation Schemas" con "DTOs" porque ambos definen la forma de los datos, pero tienen propósitos distintos en capas diferentes.

### A. Validation Schemas (Capa HTTP / Routes)
- **Responsabilidad**: Validar que la petición HTTP externa sea correcta antes de procesarla.
- **Ubicación**: Usados en rutas.
- **Estructura**: Reflejan la estructura de una petición HTTP (`body`, `query`, `params`).
- **Ejemplo**:
  ```typescript
  // auth.dto.ts
  export const loginSchema = z.object({
      body: loginBodySchema, // Valida que el JSON venga en el body
      // query: ... (opcional, si usáramos query params)
  });
  ```

### B. Data Transfer Objects - DTOs (Capa de Servicio / Dominio)
- **Responsabilidad**: Definir, de manera agnóstica al protocolo (HTTP), qué datos necesita la lógica de negocio para funcionar.
- **Ubicación**: Usados en Servicios y Repositorios.
- **Estructura**: Objetos planos y limpios.
- **Ejemplo**:
  ```typescript
  // auth.dto.ts
  export const loginBodySchema = z.object({
      email: z.string().email(),
      password: z.string()
  });
  
  // El tipo inferido que usa el servicio
  export type LoginDto = z.infer<typeof loginBodySchema>;
  ```

---

## 2. ¿Por qué usar DTOs en los argumentos de funciones?

En lugar de pasar múltiples argumentos primitivos a una función, pasamos un único objeto DTO.

**❌ Forma No Recomendada:**
```typescript
// Si mañana necesitas 'captchaToken', rompes la firma de la función en todos lados.
// Además, el orden importa, es fácil equivocarse: login(password, email) ☠️
async login(email: string, password: string) { ... }
```

**✅ Forma Profesional (Implementada):**
```typescript
// Si mañana necesitas más datos, solo agregas el campo al DTO.
// La firma de la función input no cambia drásticamente.
async login(data: LoginDto) { 
    const { email, password } = data;
    ... 
}
```

### Beneficios Clave:
1.  **Single Source of Truth (Fuente Única de Verdad)**: El DTO define la verdad absoluta de lo que se require para hacer un login.
2.  **Extensibilidad**: Facilita agregar nuevos campos opcionales sin romper el código existente.
3.  **Seguridad de Tipos**: TypeScript nos protege asegurando que el objeto cumple estrictamente con el contrato.

---

## 3. DTOs para Entrada y Salida

Los DTOs se utilizan en ambas direcciones:

*   **Input DTO (Request)**: Protege tu dominio de datos basura. 
    *   *Ejemplo*: `RegisterDto`, `LoginDto`.
*   **Output DTO (Response)**: Protege al usuario filtrando datos sensibles.
    *   *Ejemplo*: `SafeUserDto` (devuelve el usuario pero excluye el `password`).

---

## Resumen del Flujo de Datos

1.  **Petición HTTP** (`POST /login`).
2.  **Middleware de Validación**: Usa `loginSchema` para rechazar peticiones mal formadas (400 Bad Request).
3.  **Controller**: Extrae el `req.body` (que ahora sabemos que es seguro).
4.  **Service**: Recibe el `request.body` como un `LoginDto`.
5.  **Repository**: Interactúa con la BD.
6.  **Retorno**: El servicio devuelve un `SafeUserDto` hacia arriba.

Esta separación de responsabilidades es la base de aplicaciones escalables y mantenibles.

---


# Estándar de DTOs y Schemas de Validación (Resumen)

Esta sección describe las convenciones y estructura para los Objetos de Transferencia de Datos (DTOs) y los schemas de validación en este proyecto, como referencia para todo el equipo.

## Convenciones de Nombres

- `<name>Schema`: Schema de Zod para el body de la petición (ej: `loginSchema`, `registerSchema`).
- `<name>RequestSchema`: Schema de Zod para la request completa (body/query/params), usado por el middleware de validación (ej: `loginRequestSchema`).
- `<Name>Dto`: Tipo TypeScript inferido del schema del body (ej: `LoginDto`).

## Ejemplo (de auth.dto.ts)

```ts
// Schema de Zod para el body de login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Schema de Zod para la request completa de login (body/query/params)
export const loginRequestSchema = z.object({
  body: loginSchema,
});

// Tipo inferido del schema del body
export type LoginDto = z.infer<typeof loginSchema>;
```

## Fundamento

- **Claridad**: Cada schema y tipo tiene una responsabilidad única y clara.
- **Consistencia**: Todos los módulos siguen la misma estructura y convención de nombres.
- **Separación**: La validación (Zod) y la inferencia de tipos (TypeScript) están sincronizadas pero separadas de la lógica de negocio.

## Uso

- Usa `<name>Schema` para validar el body en controladores/servicios.
- Usa `<name>RequestSchema` para validar la request completa en middlewares.
- Usa `<Name>Dto` como tipo para argumentos de funciones y lógica de negocio.

---

Seguir este estándar asegura un código mantenible, escalable y robusto en todo el proyecto.
