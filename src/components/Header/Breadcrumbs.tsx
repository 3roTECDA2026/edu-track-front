import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Minimalist pure presentational Breadcrumbs component.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <Box
      component="nav"
      aria-label="breadcrumb"
      sx={{
        px: { xs: 2, sm: 3 },
        py: 0.75,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #000000',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <MuiBreadcrumbs
        separator={<Typography component="span" sx={{ fontSize: '0.75rem', color: '#666666' }}>/</Typography>}
        sx={{
          '& .MuiBreadcrumbs-separator': { mx: 1 },
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast ? (
            <Typography
              key={item.label}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#000000',
                letterSpacing: '0.01em',
              }}
            >
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.label}
              underline="hover"
              href={item.href || '#'}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
              }}
              sx={{
                fontSize: '0.75rem',
                color: '#555555',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                '&:hover': { color: '#000000' },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
