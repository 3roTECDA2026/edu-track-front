import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  BoxProps,
  TabsProps as MuiTabsProps,
} from '@mui/material';

interface CustomTabsProps {
  tabs: string[];
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  containerSx?: BoxProps['sx'];
  tabsSx?: MuiTabsProps['sx'];
  variant?: 'standard' | 'scrollable' | 'fullWidth';
}

export const CustomTabs: React.FC<CustomTabsProps> = ({
  tabs,
  value,
  onChange,
  containerSx,
  tabsSx,
  variant = 'standard',
}) => {
  // Estilos por defecto
  const defaultContainerSx: BoxProps['sx'] = {
    borderBottom: 1,
    borderColor: '#e5e7eb',
    px: 2,
    pt: 1,
  };

  const defaultTabsSx: MuiTabsProps['sx'] = {
    '& .MuiTab-root': {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
      color: '#6b7280',
      '&.Mui-selected': { color: '#111827' },
    },
  };

  return (
    <Box sx={{ ...defaultContainerSx, ...containerSx }}>
      <Tabs
        value={value}
        onChange={onChange}
        textColor="inherit"
        variant={variant}
        TabIndicatorProps={{ style: { backgroundColor: '#111827', height: 2 } }}
        sx={{ ...defaultTabsSx, ...tabsSx }}
      >
        {tabs.map((label, index) => (
          <Tab key={`${label}-${index}`} label={label} />
        ))}
      </Tabs>
    </Box>
  );
};

export default CustomTabs;
