// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ConflictDeadlineBadge } from '@/components/conflicts/ConflictDeadlineBadge'

afterEach(cleanup)

describe('indicador del plazo de 24 hs de un conflicto (CRM-094)', () => {
  it('registrado en menos de 24 hs: "Registrado en plazo"', () => {
    render(<ConflictDeadlineBadge withinDeadline={true} elapsedHours={2} />)

    expect(screen.getByText('Registrado en plazo')).toBeTruthy()
  })

  it('fuera de plazo: muestra las horas transcurridas', () => {
    render(<ConflictDeadlineBadge withinDeadline={false} elapsedHours={30} />)

    expect(screen.getByText('Fuera de plazo (30 hs)')).toBeTruthy()
  })

  it('sin fecha del suceso: avisa que el plazo no se puede calcular', () => {
    render(<ConflictDeadlineBadge withinDeadline={null} elapsedHours={null} />)

    expect(screen.getByText('Sin fecha del suceso')).toBeTruthy()
    expect(screen.queryByText(/plazo/i)).toBeNull()
  })
})
