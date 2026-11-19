import { useTranslation } from 'react-i18next';
import { Navigate, NavLink, Outlet } from 'react-router';
import { useGetMe } from '@/api/generated/endpoints/identity/identity';
import { endSession } from '@/shared/auth/session';
import { rolePath } from '@/shared/routes/paths';
import { Button } from '@/shared/ui/button';
import { Breadcrumbs } from './breadcrumbs';

export type Role = 'student' | 'coach' | 'admin';

const NAV: Record<Role, { to: string; labelKey: string }[]> = {
  student: [
    { to: '/student', labelKey: 'nav.overview' },
    { to: '/student/sessions', labelKey: 'nav.sessions' },
  ],
  coach: [
    { to: '/coach', labelKey: 'nav.overview' },
    { to: '/coach/availability', labelKey: 'nav.availability' },
  ],
  admin: [
    { to: '/admin', labelKey: 'nav.overview' },
    { to: '/admin/users', labelKey: 'nav.users' },
    { to: '/admin/programs', labelKey: 'nav.programs' },
  ],
};

/** Shell of one role's section. A user on another role's section is sent to their own. */
export function RoleArea({ role }: { role: Role }) {
  const { t } = useTranslation();
  const { data } = useGetMe();
  const me = data?.status === 200 ? data.data : null;
  if (!me) return null;
  if (me.role !== role) return <Navigate to={rolePath(me.role)} replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
        <span className="font-semibold">{t('app.name')}</span>
        <nav aria-label={t('nav.label')} className="flex gap-4 text-sm">
          {NAV[role].map(({ to, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === rolePath(role)}
              className={({ isActive }) => (isActive ? 'font-semibold' : 'text-muted-foreground')}
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{t('home.signedInAs', { name: me.displayName })}</span>
          <Button onClick={endSession}>{t('home.logout')}</Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}
