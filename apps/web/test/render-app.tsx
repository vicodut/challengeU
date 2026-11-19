import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { redirectToLoginOnUnauthorized } from '@/app/unauthorized-redirect';
import { routes } from '@/app/routes';

/** Renders the whole route tree at `path` and wires the 401 redirect, as main.tsx does. */
export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const stop = redirectToLoginOnUnauthorized(router, queryClient);
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, stop };
}
