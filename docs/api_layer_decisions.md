# Guia de arquitectura de la API REST

## Objetivo

Este documento resume las decisiones tecnicas que adoptamos para mantener una API REST limpia, tipada y facil de escalar.

El objetivo principal es separar responsabilidades por capa para evitar acoplamiento entre HTTP, logica de negocio y persistencia.

## Decisiones clave

1. La validacion de entrada se hace en middleware con Zod y los controladores consumen `req.validated`.
2. Los servicios trabajan con contratos de aplicacion/dominio (`*.type.ts`), no con DTOs HTTP.
3. Los repositorios traducen infraestructura a dominio con `toDomain()`.
4. La serializacion segura de salida HTTP se hace en controladores con `safe*Schema`.
5. La paginacion offset y cursor se centraliza en utilidades compartidas.

## Responsabilidades por capa

| Capa | Debe hacer | No debe hacer |
|---|---|---|
| Controller | Leer `req.validated`, llamar service, construir respuesta HTTP, serializar salida segura | Logica de negocio compleja o queries a BD |
| Service | Reglas de negocio, autorizacion de negocio, orquestar repositorios/servicios | Dependencia de `req/res` o shape HTTP |
| Repository | Acceso a BD, queries Prisma, mapear a dominio con `toDomain()` | Logica de negocio de casos de uso |

## Patron req.validated

`validateRequest` valida `body/query/params` y guarda resultados en `req.validated`.

Regla practica:
- En controladores, usar siempre `req.validated.body/query/params`.
- Evitar leer `req.body`, `req.query`, `req.params` como fuente principal de datos de negocio.

### Ejemplo (controller)

```ts
async getAllSubscriptions(req: Request, res: Response, _next: NextFunction) {
  const sub = req.user?.sub as string;
  const { cursor, limit } = req.validated
    .query as SubscriptionCursorPaginationQueryDto;

  const page = await this.subscriptionService.getAllSubscriptions(sub, {
    cursor,
    limit,
  });

  const serializedSubscriptions = page.subscriptions.map((subscription) =>
    safeSubscriptionSchema.parse(subscription),
  );

  res.status(200).json({
    data: { subscriptions: serializedSubscriptions },
    meta: {
      nextCursor: page.nextCursor,
      hasNextPage: page.hasNextPage,
    },
  });
}
```

## DTOs HTTP vs Types de aplicacion/dominio

### DTO (`*.dto.ts`)

Uso principal:
- Contratos de entrada/salida HTTP
- Validacion runtime con Zod
- Frontera externa de la API

Ejemplos:
- `CreateSubscriptionDto`
- `SafeSubscriptionDto`

### Types (`*.type.ts`)

Uso principal:
- Contratos internos de servicio y repositorio
- Dominio y casos de uso
- Sin dependencia directa de Express o shape HTTP

Ejemplos:
- `SubscriptionDomain`
- `CreateSubscriptionInput`
- `CreateSubscriptionData`

## CreateSubscriptionInput vs CreateSubscriptionData

En `subscription.type.ts`:

- `CreateSubscriptionInput` representa lo que el caso de uso recibe desde el borde de la aplicacion.
- `CreateSubscriptionData` representa lo que el repositorio necesita para persistir.

`CreateSubscriptionInput` usa:

```ts
type CreateSubscriptionInput = Omit<CreateSubscriptionData, 'id' | 'userId'>;
```

### Por que usar Omit aqui

1. `id` lo genera el sistema (`uuidv7`), no el cliente.
2. `userId` viene del usuario autenticado (JWT), no del body.
3. Evita overposting y asignacion de recursos a otro usuario.
4. Expresa claramente la diferencia entre input externo y data persistible interna.

### Ejemplo (service)

```ts
async createSubscription(
  data: CreateSubscriptionInput,
  authUser: JWTPayload,
): Promise<SubscriptionDomain> {
  const userId = authUser.sub;

  await this.currencyService.getCurrencyByCode(data.currencyCode);
  await this.categoryService.getCategoryById(data.categoryId, userId);

  const subscriptionData: CreateSubscriptionData = {
    id: uuidv7(),
    userId,
    ...data,
  };

  return this.subscriptionRepository.create(subscriptionData);
}
```

## toDomain vs safeSubscriptionSchema

Aunque hoy puedan verse parecidos, tienen responsabilidades distintas.

### `toDomain()` (repository)

- Traduce modelo de Prisma a `SubscriptionDomain`.
- Es transformacion interna infraestructura -> dominio.
- Punto unico para conversiones tecnicas (ejemplo: Decimal -> number).

### `safeSubscriptionSchema` / `SafeSubscriptionDto` (controller)

- Define el contrato publico de salida HTTP.
- Valida/sanitiza la respuesta antes de enviar al cliente.
- Protege la frontera externa de cambios internos del dominio.

### Ejemplo (repository)

```ts
private toDomain(subscription: Subscription): SubscriptionDomain {
  return {
    id: subscription.id,
    userId: subscription.userId,
    categoryId: subscription.categoryId,
    currencyCode: subscription.currencyCode,
    name: subscription.name,
    cost: Number(subscription.cost),
    costType: subscription.costType,
    billingFrequency: subscription.billingFrequency,
    billingUnit: subscription.billingUnit,
    firstPaymentDate: subscription.firstPaymentDate,
    trialEndsOn: subscription.trialEndsOn,
  };
}
```

## Paginacion: offset vs cursor

### Offset-based

Ubicacion:
- `src/shared/utils/pagination-offset.util.ts`

Uso recomendado:
- Listados simples con pagina numerica (`page`, `limit`).

Funciones:
- `calculateOffset(page, limit)`
- `buildPaginationMeta(...)`

### Cursor-based

Ubicacion:
- `src/shared/utils/pagination-cursor.util.ts`

Uso recomendado:
- Listados grandes o datos que cambian frecuentemente.

Patron aplicado:
- Repository consulta con `limit + 1`.
- Service usa `buildCursorPaginationWindow(...)`.
- Controller responde `data + meta` con `nextCursor` y `hasNextPage`.

## Flujo completo (Subscription)

1. Route aplica `validateRequest(schema)`.
2. Controller lee `req.validated`.
3. Service aplica reglas de negocio y autorizacion de negocio.
4. Service llama repository con tipos internos.
5. Repository consulta Prisma y mapea con `toDomain()`.
6. Controller serializa con `safeSubscriptionSchema.parse(...)`.
7. API responde al cliente con contrato estable.

## Checklist para un nuevo endpoint

- [ ] Definir schema Zod de request en `*.dto.ts`.
- [ ] Definir tipo de salida segura (`safe*Schema`) si aplica.
- [ ] Definir contratos internos en `*.type.ts`.
- [ ] En controller, consumir `req.validated`.
- [ ] En service, usar tipos de aplicacion/dominio.
- [ ] En repository, mapear con `toDomain()`.
- [ ] No exponer modelos Prisma directamente.
- [ ] Serializar salida segura en controller.
- [ ] Si es lista, decidir offset o cursor y usar util compartido.
- [ ] Agregar pruebas de integracion del endpoint.

## Anti-patrones a evitar

1. Usar DTO HTTP dentro de repository.
2. Poner parseo Zod de salida dentro del service.
3. Leer `req.body/req.query/req.params` directamente sin `req.validated`.
4. Duplicar logica de paginacion en cada modulo en lugar de util compartido.

## Resumen ejecutivo

- Repository: infraestructura -> dominio (`toDomain`).
- Service: reglas de negocio con contratos internos.
- Controller: borde HTTP (entrada validada y salida serializada).

Esta separacion permite evolucionar API, dominio y persistencia con menor friccion y menor riesgo de regresiones.
