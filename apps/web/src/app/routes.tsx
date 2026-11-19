import { useTranslation } from 'react-i18next';
import { createBrowserRouter, redirect } from 'react-router';
import { HealthStatus } from '@/features/ops';
import { HomePage, LoginPage } from '@/features/identity';
import { getCredentials } from '@/shared/auth/session';
import { HOME_PATH, LOGIN_PATH } from '@/shared/routes/paths';

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

export const routes = [
  { path: '/', element: <StatusPage /> },
  { path: LOGIN_PATH, element: <LoginPage /> },
  {
    path: HOME_PATH,
    loader: requireCredentials,
    HydrateFallback: () => null,
    element: <HomePage />,
  },
];

export const router = createBrowserRouter(routes);
