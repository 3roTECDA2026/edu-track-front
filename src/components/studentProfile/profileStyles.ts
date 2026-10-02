export const sectionTitleSx = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#5f6368',
  mb: 2,
} as const;

export const headerCellSx = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#5f6368',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #e0e0e0',
} as const;

export const bodyCellSx = {
  fontSize: '0.85rem',
  py: 1.5,
  borderBottom: '1px solid #eeeeee',
} as const;

export const cardsGridSx = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
} as const;

export const darkButtonSx = {
  textTransform: 'none',
  backgroundColor: '#202124',
  '&:hover': { backgroundColor: '#000000' },
} as const;
