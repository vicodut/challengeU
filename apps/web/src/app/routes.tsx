import { useTranslation } from 'react-i18next';
import { createBrowserRouter, Navigate, redirect } from 'react-router';
import { BlockPage, BlocksPage, NewBlockPage } from '@/features/availability';
import { HealthStatus } from '@/features/ops';
import {
  NewProgramPage,
  ProgramDetailPage,
  ProgramsPage,
  RegisterStudentPage,
  StudentDetailPage,
  StudentCoachesPage,
  StudentsPage,
} from '@/features/enrollment';
import { LoginPage } from '@/features/identity';
import { useGetMe } from '@/api/generated/endpoints/identity/identity';
import { getCredentials } from '@/shared/auth/session';
import { HOME_PATH, LOGIN_PATH, rolePath } from '@/shared/routes/paths';
import { RoleArea } from './role-area';

function requireCredentials() {
  if (!getCredentials()) return redirect(LOGIN_PATH);
  return null;
}

function StatusPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">{t('app.name')}</h1>
      <HealthStatus />
    </main>
  );
}

/** Sends the signed-in user to their own role's section. */
function HomeRedirect() {
  const { data } = useGetMe();
  const me = data?.status === 200 ? data.data : null;
  return me ? <Navigate to={rolePath(me.role)} replace /> : null;
}

function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return <h2 className="text-2xl font-semibold">{t(titleKey)}</h2>;
}

function ZonedRoute({ page: Page }: { page: typeof BlocksPage }) {
  const { data } = useGetMe();
  return data?.status === 200 ? <Page timeZone={data.data.timeZone} /> : null;
}

export const routes = [
  { path: '/', element: <StatusPage /> },
  { path: LOGIN_PATH, element: <LoginPage /> },
  {
    loader: requireCredentials,
    HydrateFallback: () => null,
    children: [
      { path: HOME_PATH, element: <HomeRedirect /> },
      {
        path: '/student',
        element: <RoleArea role="student" />,
        handle: { crumb: 'area.student' },
        children: [
          { index: true, element: <PlaceholderPage titleKey="nav.overview" /> },
          {
            path: 'coaches',
            handle: { crumb: 'nav.coaches' },
            element: <StudentCoachesPage />,
          },
          {
            path: 'sessions',
            handle: { crumb: 'nav.sessions' },
            element: <PlaceholderPage titleKey="nav.sessions" />,
          },
        ],
      },
      {
        path: '/coach',
        element: <RoleArea role="coach" />,
        handle: { crumb: 'area.coach' },
        children: [
          { index: true, element: <PlaceholderPage titleKey="nav.overview" /> },
          {
            path: 'availability',
            handle: { crumb: 'nav.availability' },
            children: [
              { index: true, element: <ZonedRoute page={BlocksPage} /> },
              {
                path: 'new',
                handle: { crumb: 'availability.new.title' },
                element: <ZonedRoute page={NewBlockPage} />,
              },
              {
                path: ':id',
                handle: { crumb: 'availability.detail.title' },
                element: <ZonedRoute page={BlockPage} />,
              },
            ],
          },
        ],
      },
      {
        path: '/admin',
        element: <RoleArea role="admin" />,
        handle: { crumb: 'area.admin' },
        children: [
          { index: true, element: <PlaceholderPage titleKey="nav.overview" /> },
          {
            path: 'users',
            handle: { crumb: 'nav.users' },
            element: <PlaceholderPage titleKey="nav.users" />,
          },
          {
            path: 'programs',
            handle: { crumb: 'nav.programs' },
            children: [
              { index: true, element: <ProgramsPage /> },
              { path: 'new', handle: { crumb: 'programs.new' }, element: <NewProgramPage /> },
              {
                path: ':programId',
                handle: { crumb: 'programs.detail' },
                element: <ProgramDetailPage />,
              },
            ],
          },
          {
            path: 'students',
            handle: { crumb: 'nav.students' },
            children: [
              { index: true, element: <StudentsPage /> },
              { path: 'new', handle: { crumb: 'students.new' }, element: <RegisterStudentPage /> },
              {
                path: ':studentId',
                handle: { crumb: 'students.detail' },
                element: <StudentDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
