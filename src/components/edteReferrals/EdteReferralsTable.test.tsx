// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EdteReferralsFilters } from '@/components/edteReferrals/EdteReferralsFilters'
import { EdteReferralsTable } from '@/components/edteReferrals/EdteReferralsTable'
import { EMPTY_FILTERS, type ReferralRow } from '@/components/edteReferrals/referralRows'

afterEach(cleanup)

const row = (overrides: Partial<ReferralRow>): ReferralRow => ({
  studentId: 's1',
  firstName: 'Sofía',
  lastName: 'Pérez',
  dni: '45111222',
  section: { id: 'c1', grade: 2, division: 'A', shift: 'MORNING' },
  pendingCount: 5,
  pate: null,
  ...overrides,
})

const rows = [
  row({}),
  row({
    studentId: 's2',
    firstName: 'Mateo',
    lastName: 'García',
    dni: '46222333',
    section: null,
    pendingCount: 6,
    pate: { id: 'p2', status: 'IN_PROGRESS' },
  }),
]

const renderTable = (props: Partial<Parameters<typeof EdteReferralsTable>[0]> = {}) => {
  const handlers = { onViewProfile: vi.fn(), onCreatePate: vi.fn(), onAddToMeeting: vi.fn() }
  render(
    <EdteReferralsTable
      rows={rows}
      loading={false}
      pateUnavailable={false}
      {...handlers}
      {...props}
    />
  )
  return handlers
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement

describe('EdteReferralsTable', () => {
  it('muestra alumno, DNI, curso, MPAA y estado del PATE', () => {
    renderTable()
    const sofia = within(rowOf('Pérez, Sofía'))
    expect(sofia.getByText('45111222')).toBeTruthy()
    expect(sofia.getByText('2° A · Mañana')).toBeTruthy()
    expect(sofia.getByText('5')).toBeTruthy()
    expect(sofia.getByText('Sin PATE')).toBeTruthy()

    const mateo = within(rowOf('García, Mateo'))
    expect(mateo.getByText('Sin curso')).toBeTruthy()
    expect(mateo.getByText('En curso')).toBeTruthy()
  })

  it('resalta solo a los alumnos sin PATE', () => {
    renderTable()
    expect(rowOf('Pérez, Sofía').dataset.withoutPate).toBe('true')
    expect(rowOf('García, Mateo').dataset.withoutPate).toBeUndefined()
  })

  it('"Crear PATE" aparece solo sin PATE y queda deshabilitado mientras no exista la pantalla', () => {
    renderTable()
    const create = screen.getByRole('button', {
      name: 'Crear PATE de Pérez, Sofía',
    }) as HTMLButtonElement
    expect(create.disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Crear PATE de García, Mateo' })).toBeNull()
  })

  it('"Ver ficha" y "Agregar a reunión" avisan con la fila', () => {
    const handlers = renderTable()
    fireEvent.click(screen.getByRole('button', { name: 'Ver ficha de García, Mateo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a Pérez, Sofía a una reunión' }))
    expect(handlers.onViewProfile).toHaveBeenCalledWith(rows[1])
    expect(handlers.onAddToMeeting).toHaveBeenCalledWith(rows[0])
  })

  it('si no se sabe el estado del PATE, no resalta ni ofrece crearlo', () => {
    renderTable({ pateUnavailable: true })
    expect(rowOf('Pérez, Sofía').dataset.withoutPate).toBeUndefined()
    expect(screen.queryByText('Sin PATE')).toBeNull()
    expect(screen.getAllByLabelText('Estado del PATE desconocido')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Crear PATE/ })).toBeNull()
  })
})

describe('EdteReferralsFilters', () => {
  const options = { grades: [2, 3], divisions: ['A', 'B'], shifts: ['MORNING' as const] }

  it('el buscador avisa el texto escrito', () => {
    const onChange = vi.fn()
    render(
      <EdteReferralsFilters
        filters={EMPTY_FILTERS}
        options={options}
        onChange={onChange}
        onClear={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Buscar por nombre, apellido o DNI'), {
      target: { value: 'perez' },
    })
    expect(onChange).toHaveBeenCalledWith({ search: 'perez' })
  })

  it('ofrece solo los años del listado y avisa el elegido', () => {
    const onChange = vi.fn()
    render(
      <EdteReferralsFilters
        filters={EMPTY_FILTERS}
        options={options}
        onChange={onChange}
        onClear={vi.fn()}
      />
    )
    fireEvent.mouseDown(screen.getByText('Todos los años'))
    const listbox = within(screen.getByRole('listbox'))
    expect(listbox.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Todos los años',
      '2° Año',
      '3° Año',
    ])
    fireEvent.click(listbox.getByText('3° Año'))
    expect(onChange).toHaveBeenCalledWith({ grade: '3' })
  })

  it('"Limpiar" aparece solo con algún filtro activo', () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <EdteReferralsFilters
        filters={EMPTY_FILTERS}
        options={options}
        onChange={vi.fn()}
        onClear={onClear}
      />
    )
    expect(screen.queryByRole('button', { name: 'Limpiar' })).toBeNull()

    rerender(
      <EdteReferralsFilters
        filters={{ ...EMPTY_FILTERS, shift: 'MORNING' }}
        options={options}
        onChange={vi.fn()}
        onClear={onClear}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(onClear).toHaveBeenCalled()
  })
})
