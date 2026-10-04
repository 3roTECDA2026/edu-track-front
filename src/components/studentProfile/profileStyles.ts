// Estilos compartidos de la ficha del alumno, alineados al estándar MUI del equipo (estandar-mui).
// La tipografía, los botones y los encabezados de tabla salen del theme, por eso no se repiten acá.

export const COLORS = {
  ink: '#111827',
  tableText: '#374151',
  label: '#4b5563',
  muted: '#6b7280',
  disabled: '#9ca3af',
  border: '#e5e7eb',
  surface: '#f3f4f6',
  danger: '#dc2626',
} as const;

// Etiqueta chica en mayúscula, con el mismo aspecto que el encabezado de tabla del estándar.
export const labelSx = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: COLORS.label,
} as const;

export const cardSx = {
  borderRadius: 2,
  borderColor: COLORS.border,
} as const;

export const headerCellSx = {
  whiteSpace: 'nowrap',
} as const;

export const bodyCellSx = {
  color: COLORS.tableText,
} as const;

export const cardsGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
} as const;