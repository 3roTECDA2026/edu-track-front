import { Fragment, type ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { sectionTitleSx } from '@/components/studentProfile/profileStyles';
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
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
      <Typography sx={sectionTitleSx}>{title}</Typography>

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
              <Box component="dt" sx={{ color: '#5f6368', fontSize: '0.85rem', mt: { xs: 1, sm: 0 } }}>
                {field.label}
              </Box>
              <Box component="dd" sx={{ m: 0, fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-word' }}>
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
