import { Box, TextField, MenuItem } from '@mui/material'

const SECCIONES = ['1A', '1B', '2A', '2B', '3A', '3B']

export default function SectionSelector({ date, setDate, section, setSection }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <TextField
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 180 }}
      />
      <TextField
        select
        label="Sección"
        value={section}
        onChange={(e) => setSection(e.target.value)}
        sx={{ minWidth: 150 }}
      >
        {SECCIONES.map((s) => (
          <MenuItem key={s} value={s}>{s}</MenuItem>
        ))}
      </TextField>
    </Box>
  )
}