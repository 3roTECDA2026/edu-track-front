import { useState } from 'react'

import type { EdteMeetingDetail } from '@/services/edteMeeting.service'

// Alumno elegido en el selector, con lo necesario para mostrarlo
export interface StudentOption {
  studentId: string
  label: string
  detail: string
}

export const studentLabel = (student: { lastName: string; firstName: string; dni: string }) =>
  `${student.lastName}, ${student.firstName} (DNI ${student.dni})`

export const sectionLabel = (section: { grade: number; division: string } | null) =>
  section ? `${section.grade}° ${section.division}` : 'Sin curso en el ciclo'

// Integrantes convocados, alumnos tratados y consideraciones por alumno de una reunión del EDTE
// (CRM-075). Parte de los datos de la reunión que se edita (o vacío si es nueva) y no vuelve a
// sincronizarse: el formulario se monta recién cuando esos datos ya están cargados.
// `initialStudent`: un alumno para sumar de entrada (el de "Agregar a reunión" de la pantalla de
// derivados, CRM-074). Si ya está en la reunión, no se repite.
export function useMeetingParticipants(
  meeting?: EdteMeetingDetail,
  initialStudent?: StudentOption
) {
  // Convocados: userId → presente. Si no está en el mapa, no fue convocado
  const [members, setMembers] = useState<Map<string, boolean>>(
    () => new Map(meeting?.members.map((member) => [member.userId, member.present]) ?? [])
  )
  const [students, setStudents] = useState<StudentOption[]>(() => {
    const fromMeeting =
      meeting?.students.map((student) => ({
        studentId: student.studentId,
        label: studentLabel(student),
        detail: sectionLabel(student.section),
      })) ?? []
    const alreadyIn = fromMeeting.some((student) => student.studentId === initialStudent?.studentId)
    return initialStudent && !alreadyIn ? [...fromMeeting, initialStudent] : fromMeeting
  })
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (meeting?.students ?? []).map((student) => [student.studentId, student.notes ?? ''])
    )
  )

  const toggleConvened = (userId: string) =>
    setMembers((prev) => {
      const next = new Map(prev)
      if (next.has(userId)) next.delete(userId)
      else next.set(userId, true)
      return next
    })

  // Solo se puede estar presente si se fue convocado
  const togglePresent = (userId: string) =>
    setMembers((prev) => (prev.has(userId) ? new Map(prev).set(userId, !prev.get(userId)) : prev))

  const setNote = (studentId: string, text: string) =>
    setNotes((prev) => ({ ...prev, [studentId]: text.slice(0, 2000) }))

  return {
    members,
    students,
    notes,
    setStudents,
    toggleConvened,
    togglePresent,
    setNote,
    convenedCount: members.size,
    presentCount: [...members.values()].filter(Boolean).length,
    // Lo que se manda al back
    toPayload: () => ({
      members: [...members].map(([userId, present]) => ({ userId, present })),
      students: students.map((student) => ({
        studentId: student.studentId,
        notes: notes[student.studentId]?.trim() || null,
      })),
    }),
  }
}
