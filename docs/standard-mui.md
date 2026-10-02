# Estándar de UI — Notar (CRM-029)

Guía de los componentes y convenciones de interfaz del proyecto. La idea es
que **todas las pantallas se vean iguales**: mismos encabezados, mismas tablas,
mismos botones y colores.


## Reglas generales

- **Idioma del código:** variables y funciones en **inglés**; comentarios en
  **castellano**; textos visibles de la interfaz en **castellano**.
- **Colores:** la app es **blanco y negro**. El negro del estándar es `#111827`.
  El único rojo permitido es `#dc2626` (acciones de eliminar / error). No usar
  azules ni otros colores de marca.
- **Tipografía y tamaños:** salen del `theme` (`src/theme/theme.ts`). No escribir
  tamaños de fuente a mano en las pantallas; usar los `variant` de MUI
  (`h4` título de página, `h6` título interno, `body2` datos de tabla).
- **Fuente:** Roboto (ya configurada en el theme).

---

## Componentes reutilizables (`src/components/common/`)

### `PageHeader`
Encabezado de pantalla: breadcrumb + título + subtítulo (y una acción opcional
a la derecha). Usar en **todas** las pantallas para que el encabezado sea igual.

```tsx
import { PageHeader } from '@/components/common/PageHeader'

<PageHeader
  title="Carga de calificaciones"
  subtitle="Ingresá las notas de cada cuatrimestre y la calificación final."
  breadcrumbs={[
    { label: 'Inicio', href: '/' },
    { label: 'Calificaciones' },
    { label: 'Carga de notas' }, // el último va en negrita automáticamente
  ]}
/>
```

Props: `title` (string), `subtitle?` (string), `breadcrumbs?` (lista de
`{ label, href?, onClick? }`), `action?` (un nodo React, ej: un botón a la derecha).

---

### `ContentCard`
Tarjeta contenedora (borde gris, esquinas redondeadas). Adentro va el contenido
de la pantalla: las pestañas (`CustomTabs`), la tabla, etc.

```tsx
import { ContentCard } from '@/components/common/ContentCard'

<ContentCard>
  <CustomTabs ... />
  {/* ... la tabla ... */}
</ContentCard>
```

Props: `children` (lo que va adentro). Acepta `sx` por si hace falta ajustar algo.

---

### `CustomTabs`
Pestañas. La activa va en negrita con barra inferior; las demás en gris.

```tsx
import { CustomTabs } from '@/components/common/CustomTabs'

<CustomTabs
  tabs={['Por materia', 'Por alumno']}
  value={tab}
  onChange={(_, next) => setTab(next)}
/>
```

Props: `tabs` (lista de textos), `value` (índice activo, número), `onChange`.

---

### `AddButton`
Botón de acción principal: fondo negro, letra blanca, sin mayúsculas.

> **Nota importante:** se llama `AddButton` ("botón de agregar") por cómo nació,
> pero en realidad es un **botón de acción general**: se usa también para
> "Guardar", "Limpiar", etc., pasándole otro ícono. **No lo renombramos a
> `ActionButton` para no romper las pantallas que ya lo usan** (Cursos,
> Estudiantes). Tenerlo en cuenta: ver un `AddButton` que dice "Guardar" es
> correcto, no es un error.

```tsx
import { AddButton } from '@/components/common/AddButton'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

<AddButton label="Nuevo curso" onClick={...} />                      {/* ícono + por defecto */}
<AddButton label="Guardar" icon={<SaveIcon />} onClick={...} />      {/* con otro ícono */}
<AddButton label="Limpiar" icon={<RestartAltIcon />} onClick={...} />
```

Props: `label` (texto), `onClick`, `icon?` (ícono; por defecto es un `+`).

---

### `EditButton`
Lapicito de editar (negro `#374151`), para las columnas de acciones de las tablas.

```tsx
import { EditButton } from '@/components/common/EditButton'

<EditButton label="Editar curso" onClick={() => onEdit(row)} />
```

Props: `onClick`, `label?` (texto del tooltip y accesibilidad; por defecto "Editar").

---

### `StandardTablePagination`
Paginado de tablas, con textos en castellano y opciones iguales para todos.

```tsx
import { StandardTablePagination } from '@/components/common/StandardTablePagination'

<StandardTablePagination
  count={filteredStudents.length}
  page={page}
  rowsPerPage={rowsPerPage}
  onPageChange={setPage}
  onRowsPerPageChange={setRowsPerPage}
  itemLabel="alumnos"          // "Mostrando 1–10 de 25 alumnos"
/>
```

Props: `count`, `page` (base 0), `rowsPerPage`, `onPageChange`, `onRowsPerPageChange`,
`itemLabel?` (palabra del total, ej: "alumnos"), `rowsPerPageOptions?` (por defecto `[10, 25, 50]`).

---

### `Breadcrumbs` (en `src/components/Header/`)
Componente de breadcrumb del proyecto. Normalmente no se usa suelto: ya viene
incluido dentro de `PageHeader`. Recibe `items` (lista de `{ label, href?, onClick? }`);
el último item va en negrita.

---

## Convenciones de tabla

Estas no son un componente, son acuerdos a respetar para que todas las tablas
queden iguales:

- La tabla va **dentro de un `ContentCard`**.
- Usar `<Table size="small">` → filas compactas, todas del mismo alto.
- Encabezado: `<TableHead sx={{ backgroundColor: '#fafafa' }}>`. Los estilos de
  las celdas de encabezado (gris, mayúsculas) ya salen del theme.
- Filas: `<TableRow hover>` → el gris al pasar el mouse es el de MUI por defecto.
- Alineación: números y notas centrados (`align="center"`); acciones a la
  derecha (`align="right"`); texto a la izquierda (por defecto).
- Debajo de la tabla, el paginado con `StandardTablePagination`.

---

## Qué NO hacer

- No escribir colores de fuente o tamaños a mano si el theme ya los da.
- No usar azules ni rojos fuera de `#dc2626`.
- No crear un botón nuevo a mano: usar `AddButton` o `EditButton`.
- No armar el encabezado a mano: usar `PageHeader`.
- No renombrar `AddButton` (rompería Cursos y Estudiantes).
