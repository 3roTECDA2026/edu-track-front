// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { GradesTab } from '@/components/studentProfile/GradesTab'
import type { StudentGrade } from '@/services/studentProfile.service'

const grade = (id: string, name: string, courseType: 'FIRST_TIME' | 'REPEAT'): StudentGrade => ({
  id,
  preliminaryAssessment1: null,
  term1Score: 8,
  preliminaryAssessment2: null,
  term2Score: null,
  finalScore: null,
  subjectStatus: 'IN_PROGRESS',
  enrollment: {
    id: `e-${id}`,
    subject: { id: `s-${id}`, name },
    classSection: { id: 'cs1', grade: 3, division: 'A' },
    academicYear: { id: 'y2026', year: 2026 },
    courseType,
  },
})

afterEach(cleanup)

describe('calificaciones de la ficha: marca R (CRM-082)', () => {
  it('marca con R solo las materias que recursa', () => {
    render(
      <GradesTab
        grades={[grade('1', 'Matemática', 'FIRST_TIME'), grade('2', 'Geografía', 'REPEAT')]}
        loading={false}
        error={undefined}
        onRetry={() => {}}
        homeSection={null}
      />
    )
    const marks = screen.getAllByLabelText('Recursa la materia')
    expect(marks).toHaveLength(1)
    const repeatedRow = screen.getByText('Geografía').closest('tr') as HTMLElement
    expect(within(repeatedRow).getByText('R')).toBeTruthy()
  })
})
