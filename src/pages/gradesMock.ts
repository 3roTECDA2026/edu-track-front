// Datos de prueba (mock) para la grilla de calificaciones.
// Archivo separado a propósito: cuando existan los endpoints reales
// (cursos, materias, estudiantes) se elimina este archivo y listo.

export type Field = 'term1Score' | 'term2Score' | 'finalScore'

export interface Course {
  id: string
  name: string
}
export interface Subject {
  id: string
  courseId: string
  name: string
}
export interface Student {
  id: string
  courseId: string
  lastName: string
  firstName: string
  dni: string
}

// Mapa plano de notas. Clave: studentId|subjectId|year|field
export type GradesMap = Record<string, number>

export const COURSES: Course[] = [
  { id: 'c1', name: '1° A' },
  { id: 'c2', name: '2° B' },
  { id: 'c3', name: '3° A' },
]

export const SUBJECTS: Subject[] = [
  { id: 'm1', courseId: 'c1', name: 'Matemática' },
  { id: 'm2', courseId: 'c1', name: 'Lengua y Literatura' },
  { id: 'm3', courseId: 'c1', name: 'Ciencias Naturales' },
  { id: 'm4', courseId: 'c2', name: 'Matemática' },
  { id: 'm5', courseId: 'c2', name: 'Historia' },
  { id: 'm6', courseId: 'c3', name: 'Prácticas del Lenguaje' },
  { id: 'm7', courseId: 'c3', name: 'Física' },
]

export const STUDENTS: Student[] = [
  { id: 'a1', courseId: 'c1', lastName: 'Acosta', firstName: 'María', dni: '48.111.222' },
  { id: 'a2', courseId: 'c1', lastName: 'Benítez', firstName: 'Juan', dni: '47.333.444' },
  { id: 'a3', courseId: 'c1', lastName: 'Coria', firstName: 'Lucía', dni: '48.555.666' },
  { id: 'a4', courseId: 'c1', lastName: 'Domínguez', firstName: 'Tomás', dni: '47.777.888' },
  { id: 'a5', courseId: 'c1', lastName: 'Fernández', firstName: 'Camila', dni: '48.999.000' },
  { id: 'a11', courseId: 'c1', lastName: 'García', firstName: 'Lautaro', dni: '48.222.333' },
  { id: 'a12', courseId: 'c1', lastName: 'Herrera', firstName: 'Sol', dni: '48.333.444' },
  { id: 'a13', courseId: 'c1', lastName: 'Ledesma', firstName: 'Iván', dni: '48.444.555' },
  { id: 'a14', courseId: 'c1', lastName: 'Molina', firstName: 'Abril', dni: '48.555.777' },
  { id: 'a15', courseId: 'c1', lastName: 'Nuñez', firstName: 'Thiago', dni: '48.666.888' },
  { id: 'a16', courseId: 'c1', lastName: 'Ortiz', firstName: 'Renata', dni: '48.777.999' },
  { id: 'a17', courseId: 'c1', lastName: 'Paredes', firstName: 'Benjamín', dni: '48.888.000' },
  { id: 'a18', courseId: 'c1', lastName: 'Quiroga', firstName: 'Delfina', dni: '48.999.111' },
  { id: 'a6', courseId: 'c2', lastName: 'Gómez', firstName: 'Sofía', dni: '46.123.456' },
  { id: 'a7', courseId: 'c2', lastName: 'Herrera', firstName: 'Mateo', dni: '46.234.567' },
  { id: 'a8', courseId: 'c2', lastName: 'Ibáñez', firstName: 'Valentina', dni: '46.345.678' },
  { id: 'a9', courseId: 'c3', lastName: 'Juárez', firstName: 'Bruno', dni: '45.456.789' },
  { id: 'a10', courseId: 'c3', lastName: 'López', firstName: 'Martina', dni: '45.567.890' },
]

export const INITIAL_GRADES: GradesMap = {
  'a1|m1|2026|term1Score': 8,
  'a1|m1|2026|term2Score': 7,
  'a1|m1|2026|finalScore': 8,
  'a2|m1|2026|term1Score': 4,
  'a2|m1|2026|term2Score': 6,
  'a3|m1|2026|term1Score': 3,
  'a4|m1|2026|term1Score': 10,
  'a4|m1|2026|term2Score': 9,
  'a4|m1|2026|finalScore': 10,
}

export const YEARS = [2025, 2026]
