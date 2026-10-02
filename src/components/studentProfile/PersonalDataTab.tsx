import { Box, Typography } from '@mui/material';
import type { StudentDetail } from '@/services/students.service';
import { StudentStatusChip } from '@/components/students/StudentStatusChip';
import { InfoCard } from '@/components/studentProfile/InfoCard';
import { SoftBadge } from '@/components/studentProfile/SoftBadge';
import { cardsGridSx } from '@/components/studentProfile/profileStyles';
import { formatDate, getAge } from '@/components/studentProfile/profileLabels';

interface PersonalDataTabProps {
  student: StudentDetail;
}

export const PersonalDataTab = ({ student }: PersonalDataTabProps) => {
  const age = getAge(student.dateOfBirth);

  return (
    <Box sx={cardsGridSx}>
      <InfoCard
        title="Datos personales"
        fields={[
          { label: 'Apellido', value: student.lastName },
          { label: 'Nombre', value: student.firstName },
          { label: 'DNI', value: student.dni },
          {
            label: 'Fecha de nacimiento',
            value: age !== null ? `${formatDate(student.dateOfBirth)} (${age} años)` : formatDate(student.dateOfBirth),
          },
          { label: 'Lugar de nacimiento', value: student.placeOfBirth },
        ]}
      />

      <InfoCard
        title="Contacto y domicilio"
        fields={[
          { label: 'Domicilio', value: student.address },
          { label: 'Localidad', value: student.city },
          { label: 'Teléfono', value: student.phone },
        ]}
      />

      <InfoCard
        title="Datos administrativos"
        fields={[
          { label: 'Legajo', value: student.recordNumber },
          { label: 'Estado', value: <StudentStatusChip status={student.status} /> },
          { label: 'Fecha de alta', value: formatDate(student.createdAt) },
          { label: 'Última actualización', value: formatDate(student.updatedAt) },
        ]}
      />

      <InfoCard title="Adultos responsables">
        {student.guardians.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No hay adultos responsables registrados.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {student.guardians.map((guardian, index) => (
              <Box
                key={guardian.id}
                sx={{ pt: index === 0 ? 0 : 2, borderTop: index === 0 ? 'none' : '1px solid #eeeeee' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {guardian.lastName}, {guardian.firstName}
                  </Typography>
                  {guardian.isPrimary && <SoftBadge label="Principal" color="#1967d2" background="#e8f0fe" />}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {[guardian.relationship, guardian.dni ? `DNI ${guardian.dni}` : null].filter(Boolean).join(' · ') ||
                    'Vínculo no informado'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {[guardian.phone, guardian.email].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </InfoCard>
    </Box>
  );
};

export default PersonalDataTab;
