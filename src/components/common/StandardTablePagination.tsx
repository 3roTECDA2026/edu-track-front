import React from 'react';
import { TablePagination, TablePaginationProps } from '@mui/material';

interface StandardTablePaginationProps {
  /** Total de filas (count) */
  count: number;
  /** Página actual, base 0 (como la maneja MUI) */
  page: number;
  /** Filas por página */
  rowsPerPage: number;
  /** Se dispara al cambiar de página */
  onPageChange: (page: number) => void;
  /** Se dispara al cambiar la cantidad de filas por página */
  onRowsPerPageChange: (rows: number) => void;
  /** Palabra para el texto "de X elementos" (ej: "alumnos", "usuarios") */
  itemLabel?: string;
  /** Opciones de filas por página (por defecto las del estándar) */
  rowsPerPageOptions?: number[];
  /** Permite pasar sx u otras props de MUI si hiciera falta */
  sx?: TablePaginationProps['sx'];
}

/**
 * Paginado estándar para todas las tablas 
 * Textos en castellano y opciones iguales para todo el equipo.
 * Cada pantalla solo pasa sus datos y, si quiere, la palabra del total.
 */
export const StandardTablePagination: React.FC<StandardTablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  itemLabel = 'elementos',
  rowsPerPageOptions = [10, 25, 50],
  sx,
}) => {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
      labelRowsPerPage="Filas por página:"
      labelDisplayedRows={({ from, to, count: total }) =>
        `Mostrando ${from}–${to} de ${total} ${itemLabel}`
      }
      sx={sx}
    />
  );
};

export default StandardTablePagination;