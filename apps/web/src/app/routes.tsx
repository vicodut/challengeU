import { createBrowserRouter } from 'react-router';
import { HealthStatus } from '@/features/ops';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <h1 className="text-3xl font-bold">ChallengeU</h1>
        <HealthStatus />
      </main>
    ),
  },
]);
