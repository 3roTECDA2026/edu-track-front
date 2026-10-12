import { Fragment, type ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { COLORS, cardSx } from '@/components/studentProfile/profileStyles';
import { EMPTY } from '@/components/studentProfile/profileLabels';

export interface InfoField {
  label: string;
  value: ReactNode;
}

interface InfoCardProps {
  title: string;
  fields?: InfoField[];
  children?: ReactNode;
}

export const InfoCard = ({ title, fields, children }: InfoCardProps) => {
  return (
    <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>

      {fields && (
        <Box
          component="dl"
          sx={{
            m: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '170px minmax(0, 1fr)' },
            rowGap: { xs: 0.5, sm: 1.25 },
            columnGap: 2,
          }}
        >
          {fields.map((field) => (
            <Fragment key={field.label}>
              <Box component="dt" sx={{ color: COLORS.muted, fontSize: '0.875rem', mt: { xs: 1, sm: 0 } }}>
                {field.label}
              </Box>
              <Box
                component="dd"
                sx={{ m: 0, fontSize: '0.875rem', fontWeight: 500, color: COLORS.ink, wordBreak: 'break-word' }}
              >
                {field.value === null || field.value === undefined || field.value === '' ? EMPTY : field.value}
              </Box>
            </Fragment>
          ))}
        </Box>
      )}

      {children}
    </Paper>
  );
};

export default InfoCard;