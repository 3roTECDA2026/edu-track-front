// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardFilters } from '@/components/edteDashboard/DashboardFilters'

afterEach(cleanup)

// Abre el selector con esa etiqueta y elige la opción
const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByLabelText(label))
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option))
}

describe('filtro por período del dashboard', () => {
  it('por defecto muestra el cuatrimestre en curso', () => {
    render(<DashboardFilters filters={{}} sections={[]} onChange={vi.fn()} />)
    expect(screen.getByLabelText('Período').textContent).toBe('Cuatrimestre en curso')
  })

  it('al elegir un cuatrimestre lo agrega a los filtros sin tocar los demás', () => {
    const onChange = vi.fn()
    render(<DashboardFilters filters={{ grade: 2 }} sections={[]} onChange={onChange} />)
    choose('Período', '2° cuatrimestre')
    expect(onChange).toHaveBeenCalledWith({ grade: 2, term: 'SECOND' })
  })

  it('al volver a "Cuatrimestre en curso" lo saca de los filtros', () => {
    const onChange = vi.fn()
    render(<DashboardFilters filters={{ term: 'FIRST' }} sections={[]} onChange={onChange} />)
    choose('Período', 'Cuatrimestre en curso')
    expect(onChange).toHaveBeenCalledWith({ term: undefined })
  })
})
