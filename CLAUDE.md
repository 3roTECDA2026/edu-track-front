# CLAUDE.md — edu-track-front (Notar)

Guía para agentes de IA y desarrolladores que trabajan en este repositorio.
Resume cómo está armado el frontend, sus convenciones y las reglas a respetar.

---

## 1. Qué es

Aplicación web de **Notar**, sistema de gestión de trayectorias escolares de la Escuela
Secundaria del ISFDyT Nº 166 (Tandil), según la normativa de la Provincia de Buenos Aires
(Res. 1650/24 DGCyE). Lo desarrolla el equipo TECDA 3º. Licencia AGPL-3.0.
Consume la API REST del repositorio `edu-track-back` (Express + Prisma + PostgreSQL).

Pantallas principales: login, panel de inicio (horarios activos y alertas de estudiantes),
usuarios, estudiantes (listado, ficha y trayectoria), cursos, inasistencias, carga de
calificaciones y RITE (con generación del PDF oficial).

## 2. Stack

| Componente | Tecnología |
| --- | --- |
| UI | React 19 |
| Lenguaje | TypeScript (`strict: true`, `noUnusedLocals`, `noUnusedParameters`) |
| Bundler | Vite 8 (alias `@/` → `src/` en `vite.config.ts` y `tsconfig.json`) |
| Componentes | Material UI 9 (`@mui/material`, `@mui/icons-material`) + Emotion |
| Ruteo | React Router 7 (`react-router-dom`) |
| Formularios | `react-hook-form` + Zod 4 (`@hookform/resolvers`) |
| PDF | `pdf-lib` (RITE sobre el formulario oficial, `src/utils/ritePdf.ts`) |
| Tests | Vitest + Testing Library + jsdom |
| Deploy | Netlify (`public/_redirects` redirige todo a `index.html` para la SPA) |

`lucide-react` está instalado, pero los íconos se toman de `@mui/icons-material`.
Antes de agregar una dependencia, verificar si MUI ya lo resuelve.

## 3. Comandos

```bash
npm install --legacy-peer-deps
npm run dev              # http://localhost:5173
npx tsc --noEmit -p .    # chequeo de tipos — correrlo antes de cada commit
npm run build            # build de producción en dist/
npm run preview          # sirve el build
npm run lint             # ESLint (hoy tiene errores previos, ver §12)
npm run format           # Prettier sobre src/
npm test                 # vitest run
```

La verificación mínima es `tsc` + `build` + probar en el navegador con el back local.
`npm test` hoy falla porque el único archivo de test está vacío (ver §12).

**Netlify:** build command `npm run build`, publish directory `dist`. Si el sitio muestra
"Expected a JavaScript module script but the server responded with a MIME type of
application/octet-stream", Netlify está publicando la carpeta del proyecto sin compilar.

## 4. Variables de entorno

Se leen con `import.meta.env` y deben empezar con `VITE_`. Plantilla: `.env.example`.

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL base del back **sin** `/api` (ej. `http://localhost:3000`). La usa `fetchApi` en `src/services/api.ts`; si no está, usa `http://localhost:3000`. |
| `VITE_USE_MOCK` | En desarrollo, el mock de `src/pages/usersMock.ts` intercepta `/users` y `/courses`. Poner `VITE_USE_MOCK=false` para usar el back real. |

Todo lo que empieza con `VITE_` queda **público** en el bundle: nunca poner secretos ahí.
En Netlify, `VITE_API_URL` debe apuntar al back publicado (no a `localhost`).

## 5. Estructura

```
index.html                 # <html lang="es">, título "Notar — ISFDyT Nº 166"
public/_redirects          # regla SPA de Netlify
docs/standard-mui.md       # estándar de UI del equipo (CRM-029) — leerlo antes de maquetar
src/
  main.tsx                 # ThemeProvider > CssBaseline > NotificationProvider > App
  App.tsx                  # monta AppRouter
  routes/AppRouter.tsx     # todas las rutas
  pages/                   # una pantalla por archivo (StudentsPage, CalificationGridPage...)
  components/
    common/                # componentes compartidos del estándar de UI (ver §7)
    layout/                # MainLayout, Aside (menú lateral), NotificationProvider
    Header/                # Header, HeaderBrand, HeaderUser, Breadcrumbs
    students/, users/      # componentes de una pantalla (tablas, filtros, diálogos, labels, schemas)
    studentProfile/        # pestañas de la ficha del estudiante
    attendance/            # filtros, tabla y modal de justificación
  hooks/                   # lógica de datos por recurso (useStudents, useGradeRoster...)
  services/                # llamadas HTTP agrupadas por recurso (*.service.ts) + api.ts
  theme/theme.ts           # tema de MUI (colores, tipografía, celdas de tabla)
  utils/                   # grades.ts, ritePdf.ts
  assets/                  # logos y el PDF base del RITE
```

Imports con alias: `import { PageHeader } from '@/components/common/PageHeader'`.

## 6. Cómo se organiza una pantalla

Patrón a seguir para código nuevo (ver `StudentsPage` / `UsersPage` como referencia):

1. **Servicio** en `src/services/<recurso>.service.ts`: tipos de la API y funciones que la
   llaman con `fetchApi<T>()`. `fetchApi` agrega el token (`Authorization: Bearer`), arma la
   URL con `VITE_API_URL` y lanza `ApiError` (con `status` y el mensaje del back) si la
   respuesta no es OK. Las rutas llevan el prefijo **`/api`** (`fetchApi('/api/students')`).
2. **Hook** en `src/hooks/use<Recurso>.ts`: estado de carga, error, datos y acciones
   (`reload`). Debe evitar que una respuesta vieja pise a una nueva: pasar un
   `AbortController` al servicio, como `useStudents`.
3. **Componentes de la pantalla** en `src/components/<recurso>/`: tabla, filtros, diálogos,
   `*Labels.ts` (traducción de enums a texto) y `*Schema(s).ts` (validación del formulario).
4. **Página** en `src/pages/`: envuelta en `MainLayout`, con `PageHeader` y el contenido
   dentro de `ContentCard` (ver §7).

Hay archivos que hacen `fetch` directo (`LoginPage`, `CalificationGridPage`,
`utils/ritePdf.ts`). Para código nuevo, centralizar las llamadas en un servicio con `fetchApi`.

### Idioma: el código nuevo va en inglés; lo que ve el usuario, en español

- En **inglés**: variables, funciones, componentes, hooks, props, tipos, constantes y nombres
  de archivos (`useGradeRoster`, `StudentStatusChip`, `isLoading`, `classSectionId`).
- En **español**: todo lo visible en pantalla, como títulos, textos, etiquetas, botones,
  placeholders y mensajes de error, éxito y confirmación (`'No se pudo cargar el listado.'`).
- Los valores que vienen del back (enums como `ACTIVE`, `TEACHER`, `MORNING`) se muestran
  traducidos con un archivo `*Labels.ts`, nunca en crudo.
- Comentarios en el código y mensajes de commit: en español.

## 7. Componentes compartidos (`src/components/common/`) ⚠️

**Regla principal:** todo elemento de interfaz que aparece en más de una pantalla se arma con
los componentes de `src/components/common/`. Así todas las pantallas se ven iguales
(mismos encabezados, tarjetas, pestañas, botones y paginado). El detalle de cada uno está en
`docs/standard-mui.md`.

| Necesito... | Usar | No hacer |
| --- | --- | --- |
| Encabezado de pantalla (breadcrumb + título + subtítulo + acción) | `PageHeader` | Armar un `Typography variant="h4"` + `Breadcrumbs` a mano |
| Contenedor de la tabla o el contenido | `ContentCard` | `Paper` / `Box` con borde propio |
| Pestañas | `CustomTabs` | `Tabs` de MUI con estilos propios |
| Botón de acción principal (Nuevo, Guardar, Limpiar...) | `AddButton` (con `icon` si no es "+") | `Button` con fondo negro escrito a mano |
| Editar una fila de tabla | `EditButton` | `IconButton` + `EditIcon` sueltos |
| Paginado de tabla | `StandardTablePagination` (con `itemLabel`) | `TablePagination` con textos propios |
| Breadcrumb | ya viene en `PageHeader` (`Header/Breadcrumbs`) | Usarlo suelto en una página |

- **`AddButton` es el botón de acción general**, aunque se llame "Add": se usa también para
  "Guardar", "Limpiar", etc. **No renombrarlo** (rompería las pantallas que ya lo usan).
- **Antes de crear un componente**, revisar si ya existe en `common/`. Si no existe y se va a
  usar en más de una pantalla, crearlo en `common/`:
  - genérico (todo por props, sin lógica ni textos de una pantalla en particular);
  - con valores por defecto del estándar y `sx` opcional que se mezcla con ellos
    (`sx={{ ...defaultSx, ...sx }}`), como los componentes existentes;
  - con un comentario que explique para qué sirve;
  - documentado en `docs/standard-mui.md`, en el mismo PR.
- Un componente que solo usa una pantalla va en `src/components/<recurso>/`. Si después
  otra pantalla lo necesita, se **mueve a `common/` y se generaliza**, no se copia.
- No modificar el aspecto de un componente de `common/` para una sola pantalla: si hace falta
  una variante, agregarla como prop y que el valor por defecto mantenga el estándar.
- Pantallas que todavía no siguen el estándar (`CoursesPage`, `StudentsPage`,
  `DailyAttendancePage`, `StudentTrajectoryPage` no usan `PageHeader`): al tocarlas, migrarlas
  a los componentes de `common/` en un commit aparte.

### Estilos y colores

- **La app es blanco y negro.** Negro del estándar `#111827` (`theme.palette.primary.main`),
  grises de texto `#6b7280` (`text.secondary`), bordes `#e5e7eb`, fondo `#f3f4f6`.
  El único rojo permitido es `#dc2626` (`theme.palette.error.main`), para eliminar/dar de baja
  y errores. No usar azules ni otros colores.
- Preferir los valores del tema (`color: 'text.secondary'`, `bgcolor: 'primary.main'`) antes
  que escribir el hex. Si un color se repite, debe salir del tema o de un componente de `common/`.
- Tipografía con los `variant` de MUI: `h4` título de página, `h6` título interno, `body2`
  datos de tabla. No escribir tamaños de fuente a mano.
- Estilos con `sx` de MUI. Evitar `style={{}}` en línea.

### Tablas

- La tabla va **dentro de un `ContentCard`**, con `<Table size="small">`.
- Encabezado: `<TableHead sx={{ backgroundColor: '#fafafa' }}>`; el resto del estilo de las
  celdas sale del tema.
- Filas con `<TableRow hover>`. Números y notas centrados, acciones a la derecha, texto a la
  izquierda.
- Debajo, `StandardTablePagination`.

### Eliminar y dar de baja

- **Siempre se pide confirmación**: ninguna acción que borre o dé de baja algo se ejecuta con
  un solo clic. Se usa un `Dialog` de MUI (ver `DeactivateStudentDialog`, `SuspendUserDialog`):
  - el título nombra lo que se va a afectar (`¿Dar de baja a Juan Pérez?`) y el texto explica
    qué pasa después (por ejemplo, que el historial se conserva);
  - botón "Cancelar" (`color="inherit"`) y botón de confirmar `variant="contained"
    color="error"`;
  - la llamada a la API se hace recién al confirmar; mientras se procesa, deshabilitar los
    botones, no cerrar el diálogo y cambiar el texto (`'Dando de baja...'`).
- Al terminar, informar el resultado con `useNotify()` (`success` / `error`), incluido el
  mensaje que devuelva el back (por ejemplo, un 409).
- Si se necesita el mismo diálogo de confirmación en otra pantalla, crear uno genérico en
  `common/` (por ejemplo `ConfirmDialog`) en vez de copiar uno existente.

### Estados de cada pantalla

Contemplar siempre **cargando**, **vacío** (ver `StudentsEmptyState`, `UsersEmptyState`),
**error** (sin mostrar datos viejos como si fueran actuales) y **datos**.
Avisos y errores: `Alert` de MUI o `useNotify()`.

## 8. Autenticación y roles

- `LoginPage` hace `POST /api/auth/login` con `{ user, password }` (`user` es el email) y
  guarda `token` y `user` en `localStorage` ("Recordarme") o `sessionStorage`.
- `fetchApi` lee el token de `sessionStorage` o `localStorage` y lo manda como
  `Authorization: Bearer <token>`.
- No hay contexto de autenticación ni rutas protegidas todavía: cualquier ruta se puede abrir
  sin sesión, y `MainLayout` muestra un usuario fijo (`'Admin'`).
- Roles en `src/services/users.service.ts`:
  - el back devuelve `BackendRole`: `ADMINISTRATOR | SCHOOL_MANAGEMENT | EOE_DIRECTIVE |
    TEACHER | PRECEPTOR | STUDENT | FAMILY`;
  - en el formulario se eligen `ROLES = ['admin', 'docente', 'preceptor']`, que se convierten
    con `ROLE_TO_BACKEND` / `fromBackendRole`;
  - los roles sin equivalente en el formulario se muestran con su valor real, no se convierten
    a otro rol.
- **El front solo oculta**: los permisos reales los valida el back (401 sin token, 403 sin
  permiso). Manejar esos códigos con un mensaje claro en español, sin mostrar el error crudo.

## 9. Agregar una pantalla nueva

1. Crear el servicio, el hook y la página según §6.
2. Agregar la ruta en `src/routes/AppRouter.tsx`, **antes** de la ruta `*` (que redirige a `/login`).
3. Agregar el ítem en el menú de `src/components/layout/Aside.tsx` (`label`, `icon` de
   `@mui/icons-material`, `path`). El ítem activo se marca comparando `path` con la URL.
4. Usar `PageHeader` con breadcrumbs y `ContentCard` para el contenido (§7).
5. Si consume un endpoint nuevo, coordinar con el back el contrato y el orden de merge.

## 10. Git y Pull Requests

- Rama de integración del sprint: **`develop-sprintN`**. Las ramas salen de ahí y los PR van
  contra ella.
- Nombres de ramas: `feature/CRM-XXX-descripcion-en-kebab-case`, `fix/descripcion`.
  Usar **el mismo nombre que la rama del back** cuando la tarea tiene las dos partes
  (ej. `feature/CRM-038-FE-BE-arreglar-problema-preceptor`).
- Commits en español con formato *conventional commits*:
  `feat(area): ...`, `fix(area): ...`, `refactor(area): ...`, `feat(ui): ...` para
  componentes de `common/`, con el ticket si aplica.
- No commitear `dist/` ni `.env`. No incluir `package-lock.json` si la tarea no cambió dependencias.
- PRs mergeados con **"Create a merge commit"**.
- Un PR = un objetivo. Separar en commits distintos los cambios de formato y los de
  funcionalidad, para que el PR se pueda revisar.
- Si el PR depende de un PR del back, indicarlo y mergear primero el back (salvo que el front
  sea compatible con la versión actual de la API).

## 11. Checklist antes de abrir un PR

- [ ] `npx tsc --noEmit -p .` sin errores y `npm run build` compila.
- [ ] Código nuevo con nombres en inglés; textos visibles para el usuario en español.
- [ ] Probado en el navegador con el back local (`VITE_USE_MOCK=false` si toca `/users` o `/courses`).
- [ ] La pantalla usa `MainLayout`, `PageHeader` y `ContentCard`.
- [ ] Botones, pestañas, edición y paginado con los componentes de `common/`; nada de eso armado a mano.
- [ ] Si se creó un componente usado en más de una pantalla: está en `common/`, es genérico y
      está documentado en `docs/standard-mui.md`.
- [ ] Solo blanco, negro, grises y `#dc2626`; tipografía con `variant` del tema.
- [ ] Estados de carga, vacío y error contemplados.
- [ ] Toda acción de eliminar o dar de baja pide confirmación antes de llamar a la API.
- [ ] Las llamadas a la API usan `fetchApi` con el prefijo `/api` y manejan 401/403 con un mensaje claro.
- [ ] Sin `console.log` de depuración, código comentado ni archivos ajenos a la tarea.

## 12. Deuda técnica conocida

Al tocar estas zonas, seguir las convenciones de arriba en lugar de copiar lo existente:

- `src/services/courses.service.ts` llama a `'/courses'` **sin** el prefijo `/api`: solo
  funciona con el mock. Contra el back real da 404.
- `src/pages/usersMock.ts` reemplaza `window.fetch` en desarrollo para `/users` y `/courses`.
  Es un mock, no una página.
- No hay rutas protegidas ni contexto de sesión; `MainLayout` muestra un usuario fijo y
  "Cerrar sesión" no borra el token.
- `LoginPage`, `CalificationGridPage` y `utils/ritePdf.ts` usan `fetch` directo en lugar de `fetchApi`.
- Hay muchos colores escritos a mano (`#111827`, `#e5e7eb`, `#374151`...) fuera del tema.
- `npm run lint` tiene errores previos (14 errores y 2 warnings).
- `src/components/StudentAlertsModule.test.ts` está vacío, por eso `npm test` falla.
- Varias pantallas no usan todavía `PageHeader` / `ContentCard` (ver §7).
