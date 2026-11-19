import { createBrowserRouter, redirect } from 'react-router';
import { HealthStatus } from '@/features/ops';
import { HomePage, LoginPage } from '@/features/identity';
import { getCredentials } from '@/shared/auth/session';

function requireCredentials() {
  if (!getCredentials()) return redirect('/login');
  return null;
}

export const routes = [
  {
    path: '/',
    element: (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <h1 className="text-3xl font-bold">ChallengeU</h1>
        <HealthStatus />
      </main>
    ),
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/home', loader: requireCredentials, element: <HomePage /> },
];

export const router = createBrowserRouter(routes);
