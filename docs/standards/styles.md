# Guía de Estilo de Código

Esta guía define el formato y estilo que debe seguir el código para mantener coherencia en todo el proyecto.

## 1. Formato
- Usar 2 espacios para indentación.
- Líneas de máximo 100 caracteres.
- Usar punto y coma al final de cada sentencia.

## 2. Nombres
- Variables y funciones: camelCase.
- Clases y tipos: PascalCase.
- Constantes: MAYÚSCULAS_CON_GUIONES.

## 3. Importaciones
- Importar módulos externos antes que internos.
- Usar rutas absolutas (`@/modules/...`) para imports internos.

## 4. Funciones
- Prefiere funciones puras y sin efectos secundarios.
- Documentar funciones complejas con JSDoc.

## 5. Objetos y Arrays
- Usar destructuring cuando sea posible.
- Preferir `const` sobre `let` si no se reasigna.

---

Se recomienda usar un formateador automático (Prettier) y linter (ESLint) para reforzar estas reglas.