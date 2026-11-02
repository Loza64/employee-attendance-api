# Employee Attendance API

API REST para gestionar la asistencia de empleados: registrar empleados, marcar entradas y salidas (check-in / check-out), corregir registros y consultar el historial con filtros por fecha y un resumen de horas trabajadas. Construida con Node.js, Express 5, TypeScript y MongoDB (Mongoose), siguiendo una arquitectura hexagonal.

## Tabla de contenido

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Modelo de datos](#modelo-de-datos)
- [Reglas de asistencia](#reglas-de-asistencia)
- [Endpoints](#endpoints)
- [Validaciones](#validaciones)
- [Formato de respuestas y errores](#formato-de-respuestas-y-errores)
- [Arquitectura](#arquitectura)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Pruebas](#pruebas)
- [Base de datos con Docker](#base-de-datos-con-docker)
- [Docker](#docker)

## Stack

| Área | Tecnología |
|---|---|
| Runtime / lenguaje | Node.js 22, TypeScript 5 |
| HTTP | Express 5, Helmet, CORS, Morgan |
| Base de datos | MongoDB con Mongoose 9 |
| Paginación | mongoose-paginate-v2 |
| Validación | class-validator, class-transformer |
| Documentación | swagger-jsdoc, swagger-ui-express |
| Pruebas | Jest, ts-jest, Supertest |
| Gestor de paquetes | pnpm |

## Requisitos

- Node.js 20.19 o superior (la imagen Docker usa Node 22)
- pnpm
- MongoDB accesible (local, remoto o el contenedor descrito en [Base de datos con Docker](#base-de-datos-con-docker))

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
pnpm dev
```

- API: `http://localhost:4300/api`
- Documentación Swagger: `http://localhost:4300/api-docs`
- Especificación OpenAPI en JSON: `http://localhost:4300/api-docs.json`

Para producción:

```bash
pnpm build
pnpm start
```

Al arrancar, la API valida `TIMEZONE`, se conecta a MongoDB y espera a que se creen los índices antes de aceptar peticiones.

## Variables de entorno

Se leen desde `.env` (ver `.env.example`).

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | `4300` | Puerto HTTP |
| `NODE_ENV` | `development` | En `development` los errores 500 incluyen el mensaje real; en otros valores devuelven un mensaje genérico |
| `ORIGIN` | vacío | Orígenes permitidos por CORS, separados por coma. Vacío permite cualquier origen (`*`) y desactiva `credentials` |
| `MONGO_URI` | `mongodb://localhost:27017/attendance_db` | Cadena de conexión a MongoDB. Con el contenedor de este proyecto lleva usuario, contraseña y `authSource=admin` (ver [Base de datos con Docker](#base-de-datos-con-docker)) |
| `TIMEZONE` | `America/El_Salvador` | Zona horaria IANA que define a qué **día** pertenece cada marca de asistencia. Si no es válida, la API no arranca |

## Scripts

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor en modo desarrollo con recarga (`ts-node-dev`) y logs `DEBUG=nodets:*` |
| `pnpm build` | Compila con `tsc` y resuelve los alias con `tsc-alias` |
| `pnpm start` | Ejecuta `build/index.js` |
| `pnpm test` | Ejecuta las pruebas |
| `pnpm test:watch` | Pruebas en modo observación |
| `pnpm lint` | ESLint sobre `src/**/*.ts` |

## Modelo de datos

### `employees` (modelo `Employee`)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (ObjectId) | Generado por MongoDB |
| `employeeCode` | string | Obligatorio, único, 3 a 20 caracteres (letras, números, `-`), se guarda en mayúsculas. **No se puede cambiar** |
| `name` | string | Obligatorio, 2 a 80 caracteres |
| `email` | string | Obligatorio, único, minúsculas |
| `department` | string | Obligatorio, 2 a 60 caracteres |
| `position` | string | Obligatorio, 2 a 60 caracteres |
| `hireDate` | string `YYYY-MM-DD` | Obligatorio, fecha de calendario válida |
| `isActive` | boolean | `true` por defecto. Un empleado inactivo no puede marcar asistencia |
| `createdAt`, `updatedAt` | date | Automáticos |

### `attendances` (modelo `Attendance`)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (ObjectId) | Generado por MongoDB |
| `employee` | ObjectId | Referencia a `Employee`; en las respuestas sale como `{ id, employeeCode, name, department, position }` |
| `date` | string `YYYY-MM-DD` | **Día laboral** de la entrada, calculado con `TIMEZONE`. Se usa para filtrar por rango de fechas |
| `checkIn` | date | Instante de entrada (UTC) |
| `checkOut` | date \| null | Instante de salida (UTC); `null` mientras el registro está abierto |
| `workedMinutes` | number \| null | Minutos entre entrada y salida; `null` mientras está abierto |
| `notes` | string \| null | Opcional, hasta 500 caracteres |
| `createdAt`, `updatedAt` | date | Automáticos |

Índices:

| Índice | Para qué sirve |
|---|---|
| `{ employee: 1, date: 1 }` único | Un solo registro por empleado y día |
| `{ employee: 1 }` único, parcial (`checkOut` nulo) | A lo sumo **una entrada abierta** por empleado, garantizado por la base de datos |
| `{ date: -1, checkIn: -1 }` | Consultas por rango de fechas, más recientes primero |

**Fechas y zona horaria.** Todos los instantes (`checkIn`, `checkOut`, `createdAt`...) se guardan y devuelven en UTC (ISO 8601). El campo `date` es el día calendario en `TIMEZONE`. Ejemplo con `America/El_Salvador` (UTC-6): una entrada a las `2026-10-20T23:30:00-06:00` (`2026-10-21T05:30:00Z`) pertenece al día `2026-10-20`.

## Reglas de asistencia

- **Check-in:** usa la hora actual del servidor. Falla con `404` si el empleado no existe y `409` si está inactivo, si ya tiene una entrada abierta o si ya registró asistencia en el día.
- **Check-out:** cierra la entrada abierta del empleado y calcula `workedMinutes`. Falla con `409` si no hay entrada abierta. Funciona aunque la entrada sea de un día anterior (turnos nocturnos).
- **Un registro por empleado y día.** Después de marcar la salida no se puede marcar otra entrada el mismo día.
- **Correcciones:** `PATCH /api/attendance/:id` permite ajustar `checkIn`, `checkOut` y `notes`. La salida debe ser posterior a la entrada, ninguna hora puede estar en el futuro, y `date` y `workedMinutes` se recalculan. Enviar `checkOut: null` reabre el registro, siempre que el empleado no tenga otro abierto.
- **Eliminar empleados:** solo si no tienen registros de asistencia; si los tienen, se responde `409` y se debe desactivar con `isActive: false`.
- Las operaciones críticas son atómicas: con peticiones simultáneas, solo una entrada o una salida prospera y las demás reciben `409`.

## Endpoints

### Empleados

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/employees` | Registra un empleado | 201 | 400, 409 |
| GET | `/api/employees` | Lista paginada con filtros | 200 | 400 |
| GET | `/api/employees/:id` | Obtiene un empleado | 200 | 400, 404 |
| PATCH | `/api/employees/:id` | Actualiza datos o activa/desactiva | 200 | 400, 404, 409 |
| DELETE | `/api/employees/:id` | Elimina un empleado sin asistencia | 204 | 400, 404, 409 |
| GET | `/api/employees/:id/attendance` | Historial de asistencia con resumen | 200 | 400, 404 |

```bash
curl -X POST http://localhost:4300/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "emp-001",
    "name": "Ana Lopez",
    "email": "ana@example.com",
    "department": "IT",
    "position": "Developer",
    "hireDate": "2026-01-15"
  }'
```

```json
{
  "data": {
    "id": "6ae7867e1e981fa3b4c424ab",
    "employeeCode": "EMP-001",
    "name": "Ana Lopez",
    "email": "ana@example.com",
    "department": "IT",
    "position": "Developer",
    "hireDate": "2026-01-15",
    "isActive": true,
    "createdAt": "2026-11-01T18:35:42.405Z",
    "updatedAt": "2026-11-01T18:35:42.405Z"
  }
}
```

**Listar:** `GET /api/employees?search=ana&department=it&isActive=true&page=1&pageSize=10`

| Parámetro | Por defecto | Reglas |
|---|---|---|
| `page` | `1` | Entero ≥ 1 |
| `pageSize` | `10` | Entero entre 1 y 100 |
| `search` | | Hasta 100 caracteres; busca sin distinguir mayúsculas en nombre, código y email |
| `department` | | Coincidencia exacta sin distinguir mayúsculas |
| `isActive` | | `true` o `false` |

Orden: más recientes primero. Parámetros desconocidos se rechazan con `400`.

**Actualizar:** `PATCH /api/employees/:id` acepta `name`, `email`, `department`, `position`, `hireDate` e `isActive` (al menos uno). El `employeeCode` no es modificable.

### Asistencia

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/attendance/check-in` | Registra la entrada | 201 | 400, 404, 409 |
| POST | `/api/attendance/check-out` | Registra la salida | 200 | 400, 404, 409 |
| GET | `/api/attendance` | Lista paginada con filtros | 200 | 400 |
| GET | `/api/attendance/:id` | Obtiene un registro | 200 | 400, 404 |
| PATCH | `/api/attendance/:id` | Corrige entrada, salida o notas | 200 | 400, 404, 409 |
| DELETE | `/api/attendance/:id` | Elimina un registro | 204 | 400, 404 |

```bash
curl -X POST http://localhost:4300/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{ "employeeId": "6ae7867e1e981fa3b4c424ab", "notes": "Llegué temprano" }'

curl -X POST http://localhost:4300/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -d '{ "employeeId": "6ae7867e1e981fa3b4c424ab" }'
```

```json
{
  "data": {
    "id": "6ae7867e1e981fa3b4c424ae",
    "employee": {
      "id": "6ae7867e1e981fa3b4c424ab",
      "employeeCode": "EMP-001",
      "name": "Ana Lopez",
      "department": "IT",
      "position": "Developer"
    },
    "date": "2026-11-01",
    "checkIn": "2026-11-01T14:02:10.000Z",
    "checkOut": "2026-11-01T22:30:45.000Z",
    "workedMinutes": 509,
    "notes": "Llegué temprano",
    "createdAt": "2026-11-01T14:02:10.120Z",
    "updatedAt": "2026-11-01T22:30:45.310Z"
  }
}
```

**Corregir:**

```bash
curl -X PATCH http://localhost:4300/api/attendance/6ae7867e1e981fa3b4c424ae \
  -H "Content-Type: application/json" \
  -d '{ "checkIn": "2026-10-20T08:00:00-06:00", "checkOut": "2026-10-20T17:30:00-06:00", "notes": null }'
```

Las horas deben ser ISO 8601 **con zona horaria** (`Z` o `±HH:MM`). Enviar `notes: null` limpia las notas.

**Listar:** `GET /api/attendance?employeeId=...&from=2026-10-01&to=2026-10-31&status=closed&page=1&pageSize=10`

| Parámetro | Descripción |
|---|---|
| `employeeId` | Solo los registros de ese empleado |
| `from`, `to` | Rango de **días** inclusivo (`YYYY-MM-DD`). Se puede enviar solo uno. `from` no puede ser posterior a `to` |
| `status` | `open` (sin salida) o `closed` (con salida) |
| `page`, `pageSize` | Paginación (por defecto 1 y 10; máximo 100) |

Orden: entrada más reciente primero.

### Historial de un empleado

`GET /api/employees/:id/attendance` acepta `from`, `to`, `status`, `page` y `pageSize`, y añade un **resumen** calculado sobre todos los registros que cumplen el filtro (no solo la página actual):

```bash
curl "http://localhost:4300/api/employees/6ae7867e1e981fa3b4c424ab/attendance?from=2026-10-01&to=2026-10-31&pageSize=3"
```

```json
{
  "data": [
    {
      "id": "6ae7867e1e981fa3b4c424b1",
      "employee": { "id": "6ae7867e1e981fa3b4c424ab", "employeeCode": "EMP-001", "name": "Ana Lopez", "department": "IT", "position": "Developer" },
      "date": "2026-10-20",
      "checkIn": "2026-10-20T14:00:00.000Z",
      "checkOut": "2026-10-20T23:30:00.000Z",
      "workedMinutes": 570,
      "notes": null,
      "createdAt": "2026-10-20T14:00:01.000Z",
      "updatedAt": "2026-10-20T23:30:02.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 3, "pageCount": 2, "total": 5 },
  "summary": { "totalRecords": 5, "totalWorkedMinutes": 1905, "openRecords": 1 }
}
```

`pageCount` viene de `mongoose-paginate-v2`, que devuelve `1` cuando no hay resultados. Con un rango sin registros, `summary` es `{ "totalRecords": 0, "totalWorkedMinutes": 0, "openRecords": 0 }`.

## Validaciones

Aplicadas antes de llegar a los casos de uso:

- **Cuerpo (DTOs):** `whitelist` y `forbidNonWhitelisted`: cualquier propiedad no declarada devuelve `400` (por ejemplo, enviar `employeeCode` al actualizar o `checkIn` al marcar una entrada). Los textos se recortan antes de validar.
- **Fechas de calendario:** `hireDate`, `from` y `to` deben ser `YYYY-MM-DD` y existir de verdad; `2026-02-30` se rechaza.
- **Fechas con hora:** `checkIn` y `checkOut` deben llevar zona horaria y ser reales. Se rechazan casos como `2026-02-30T08:00:00Z`, hora `24` o minuto `60`, porque JavaScript los aceptaría moviéndolos en silencio a otra fecha.
- **Query string:** misma regla, con conversión de tipos para `page`, `pageSize` e `isActive`.
- **Ids:** deben ser un ObjectId de 24 caracteres hexadecimales; si no, `400` sin consultar la base.
- **Reglas de negocio:** códigos y emails únicos (`409`), empleado inactivo (`409`), entrada ya abierta (`409`), salida anterior a la entrada (`400`), horas futuras (`400`), rango `from > to` (`400`).
- **Esquema Mongoose:** repite longitudes, formatos y unicidades como segunda barrera.

## Formato de respuestas y errores

- Un recurso: `{ "data": { ... } }`
- Lista: `{ "data": [ ... ], "pagination": { ... } }` (el historial añade `summary`)
- Errores: `{ "status": <código>, "message": "<detalle>" }`. En errores de validación, `message` concatena todos los problemas separados por coma.

| Código | Cuándo |
|---|---|
| 400 | Cuerpo, query o id inválidos; horas incoherentes; actualización sin campos |
| 404 | El empleado o el registro no existe |
| 409 | Código o email repetidos; empleado inactivo; entrada abierta o ya registrada; salida ya registrada; eliminar un empleado con historial |
| 500 | Error inesperado |

## Arquitectura

Arquitectura hexagonal: el dominio y los casos de uso no dependen de Express ni de Mongoose. Los puertos (`EmployeeRepository`, `AttendanceRepository`, `Clock`) se implementan en `infrastructure`.

```
src/
├── index.ts                    Arranque: valida el entorno, conecta a Mongo, espera los índices y levanta Express
├── app.ts                      Configuración de Express, rutas y Swagger
├── composition-root.ts         Inyección de dependencias manual
├── swagger.ts                  Definición OpenAPI
├── interfaces/http/routes.ts   Router raíz (/api)
├── modules/
│   ├── employee/
│   │   ├── domain/             Entidad Employee y puerto EmployeeRepository
│   │   ├── application/        Casos de uso y DTOs
│   │   └── infrastructure/     Controller, rutas, esquema Mongoose, mapper y repositorio
│   └── attendance/
│       ├── domain/             Entidad Attendance (cálculo de minutos), puertos AttendanceRepository y Clock
│       ├── application/        Check-in, check-out, corrección, listados e historial
│       └── infrastructure/     Controller, rutas, esquema, mapper, repositorio y SystemClock
└── shared/
    ├── config/                 Variables de entorno y configuración de Express
    ├── database/mongo.ts       Conexión y detección de claves duplicadas
    ├── errors/AppError.ts      Error operacional con código HTTP
    ├── middlewares/            Validación de DTO, query e id; manejador de errores
    ├── pagination/             DTOs de paginación, tipos y respuesta paginada
    ├── validators/             Validadores de fecha de calendario y fecha con zona horaria
    └── logger/                 Loggers con `debug`
```

Flujo de una petición: ruta → validación (DTO / query / id) → controller → caso de uso → puerto → repositorio Mongoose → MongoDB. Cualquier error pasa por `errorHandler`.

## Decisiones de diseño

- **Día laboral guardado aparte.** Además de los instantes UTC, cada registro guarda `date` (día en `TIMEZONE`). Así el filtrado por rango usa un índice sobre un texto `YYYY-MM-DD` y no depende de convertir zonas horarias en cada consulta, que es el problema habitual al filtrar fechas en MongoDB.
- **Reloj inyectable.** La hora actual y el cálculo del día se obtienen del puerto `Clock`, por lo que las reglas de asistencia se prueban con tiempos fijos.
- **Integridad en la base de datos.** La unicidad por día y la de "una sola entrada abierta" son índices únicos, y el cierre de una salida es una actualización condicional (`checkOut` aún nulo). No dependen de que la aplicación lea antes de escribir, así que resisten peticiones simultáneas.
- **Un registro por empleado y día.** Mantiene el modelo simple (una fila por jornada). Si se necesitaran varias entradas y salidas en el mismo día (por ejemplo, pausa de almuerzo), habría que cambiar el índice único y sumar los tramos.
- **Sin alta manual de registros.** La asistencia solo se crea con check-in; `PATCH` corrige lo existente. Una jornada olvidada no puede añadirse a posteriori con esta API.
- **Eliminar protege el historial.** Un empleado con asistencia no se borra; se desactiva. Los registros de asistencia sí pueden eliminarse individualmente.
- **Sin autenticación.** Cualquier cliente que alcance la API puede marcar asistencia de cualquier empleado. Para producción conviene protegerla (por ejemplo con JWT) y limitar quién puede corregir o eliminar registros.
- **Búsqueda con regex.** `search` usa expresión regular escapada, suficiente para volúmenes moderados.

## Pruebas

```bash
pnpm test
```

No requieren base de datos:

- Entidades: cálculo de minutos, salida posterior a la entrada y reapertura.
- Casos de uso con repositorios simulados y reloj fijo: check-in, check-out (incluido turno nocturno), correcciones, historial y reglas de empleados.
- Reloj: cambio de día según la zona horaria.
- DTOs: casos válidos e inválidos, incluidas fechas imposibles.
- Rutas HTTP con Supertest: validación de cuerpos, query e ids, y que `/api-docs.json` documente todos los endpoints.
- Repositorio de asistencia: construcción de filtros y mapeo de paginación con `paginate` simulado.

Las pruebas automáticas no ejecutan consultas reales a MongoDB. El flujo completo (índices únicos, filtros por fecha, resumen con agregación, zona horaria y peticiones simultáneas de check-in y check-out) se verificó manualmente contra una instancia real; conviene repetirlo desde `/api-docs` en tu entorno.

## Base de datos con Docker

MongoDB se levanta con el compose del repositorio [Loza64/docker-containers](https://github.com/Loza64/docker-containers/blob/main/database/mongo/docker-compose.yaml) (carpeta `database/mongo`). Esta API no incluye su propio servicio de Mongo: se conecta a ese contenedor.

Lo que define ese compose:

| Elemento | Valor |
|---|---|
| Imagen | `mongo:latest` |
| Contenedor | `some-mongo` |
| Puerto | `27017` publicado en el host |
| Usuario root | `MONGO_INITDB_ROOT_USERNAME` (por defecto `mongo`) |
| Contraseña root | `MONGO_INITDB_ROOT_PASSWORD` (por defecto `change_me`) |
| Volúmenes | `db` (`/data/db`) y `config` (`/data/configdb`) |
| Red | `network` (bridge) |
| Healthcheck | `mongosh` con `ping` cada 10 s |

Levantarlo, definiendo una contraseña propia en lugar de la de ejemplo:

```bash
cd database/mongo
MONGO_INITDB_ROOT_PASSWORD=<tu_password> docker compose up -d
```

(También puedes poner las variables en un `.env` dentro de esa carpeta.) Las credenciales solo se aplican la primera vez, cuando se crea el volumen `db`.

**Nombre de la red.** Compose antepone el nombre del proyecto, que por defecto es el de la carpeta. Al ejecutarlo desde `database/mongo`, la red `network` se crea como `mongo_network`, que es la que usa el `docker-compose.yaml` de esta API. Si lo levantas desde otra carpeta, el nombre cambia; confírmalo con `docker network ls`.

**Cadena de conexión.** El usuario root se crea en la base `admin`, por eso la URI lleva `authSource=admin`:

| Dónde corre la API | `MONGO_URI` |
|---|---|
| En tu máquina (`pnpm dev`) | `mongodb://mongo:<tu_password>@localhost:27017/attendance_db?authSource=admin` |
| En Docker (misma red) | `mongodb://mongo:<tu_password>@some-mongo:27017/attendance_db?authSource=admin` |

Dentro de un contenedor `localhost` apunta al propio contenedor, por eso en Docker se usa el nombre `some-mongo`. Si la contraseña tiene `@`, `:`, `/`, `?` o `#`, debe codificarse en formato URL.

El compose de Mongo publica `27017` en todas las interfaces. Si no necesitas acceso desde fuera de tu máquina, ese archivo trae comentada la alternativa `127.0.0.1:27017:27017` para limitarlo a localhost.

## Docker

Con MongoDB ya levantado (sección anterior):

```bash
cp .env.example .env
docker compose up --build
```

- `docker-compose.yaml` define solo el servicio `api` y lo une a la red externa `mongo_network`. Esa red debe existir antes, es decir, el contenedor de Mongo debe haberse levantado primero.
- La configuración sale del `.env`: `MONGO_URI` (con el host `some-mongo` dentro de Docker) y `TIMEZONE`.
- El `Dockerfile` es multi-etapa: instala con `--frozen-lockfile`, ejecuta `pnpm test` y `pnpm build`, y la imagen final corre como usuario sin privilegios.
- El puerto publicado es el definido en `PORT` (4300 si no se define).
- Si Mongo no está disponible al arrancar, la API termina con error y `restart: unless-stopped` la reinicia hasta que pueda conectarse.
