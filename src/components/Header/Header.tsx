import React from 'react';
import { AppBar, Toolbar } from '@mui/material';
import { HeaderBrand } from './HeaderBrand';
import { HeaderUser, UserProfile } from './HeaderUser';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

export type { UserProfile, BreadcrumbItem };

export interface HeaderProps {
  brandName?: string;
  institutionName?: string;
  role?: string;
  user?: UserProfile | null;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  onBack?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Pure presentational Header component.
 * Modular composition of:
 * - HeaderBrand: logo, brand typography, role chip, institution subtitle, back action
 * - HeaderUser: user profile avatar, name, subtitle, login/logout action
 * - Breadcrumbs: hierarchical breadcrumbs navigation sub-strip
 */
export const Header: React.FC<HeaderProps> = ({
  brandName = 'EduTrack',
  institutionName = 'Secundaria N° 10',
  role,
  user = null,
  breadcrumbs,
  showBackButton = false,
  onBack,
  onLogin,
  onLogout,
  rightAction,
}) => {
  return (
    <AppBar
      position="static"
      elevation={0}
      component="header"
      sx={{
        backgroundColor: '#ffffff',
        color: '#000000',
        borderBottom: '1px solid #000000',
        boxShadow: 'none',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 54, sm: 58 },
          px: { xs: 2, sm: 3 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <HeaderBrand
          brandName={brandName}
          institutionName={institutionName}
          role={role}
          showBackButton={showBackButton}
          onBack={onBack}
        />

        <HeaderUser
          user={user}
          onLogin={onLogin}
          onLogout={onLogout}
          rightAction={rightAction}
        />
      </Toolbar>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
    </AppBar>
  );
};

export default Header;
