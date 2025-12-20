# Estándar de Codificación

Este documento define las reglas y buenas prácticas para escribir código consistente, legible y mantenible en este proyecto.

## 1. Estructura de Carpetas
- `src/`: Código fuente principal.
- `modules/`: Cada dominio funcional en su propia carpeta.
- `shared/`: Utilidades y middlewares reutilizables.
- `docs/`: Documentación técnica y de procesos.

## 2. Organización de Archivos
- Un archivo por entidad lógica (ej: `user.service.ts`, `user.controller.ts`).
- Separar DTOs (`*.dto.ts`), types/interfaces (`*.type.ts`), y lógica de negocio.

## 3. Validación y Tipado
- Validar datos externos con Zod en la capa de rutas.
- Inferir tipos DTO desde los esquemas Zod.
- Usar interfaces/types puros para contratos internos.

## 4. Manejo de Errores
- Usar middlewares centralizados para manejo de errores.
- Definir errores personalizados en `shared/errors`.

## 5. Código Limpio
- Evitar duplicidad de lógica.
- Usar funciones pequeñas y descriptivas.
- Comentar solo cuando sea necesario para aclarar contexto.

## 6. Pruebas
- Escribir pruebas unitarias para servicios y utilidades críticas.

---

Cumplir con este estándar asegura calidad y mantenibilidad a largo plazo.