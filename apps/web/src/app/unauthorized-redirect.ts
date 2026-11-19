import type { QueryClient } from '@tanstack/react-query';
import type { createBrowserRouter } from 'react-router';
import { onUnauthorized } from '@/shared/auth/session';

/** Any 401 (credentials already cleared by the mutator) empties the cache and sends the user to /login. */
export function redirectToLoginOnUnauthorized(
  router: Pick<ReturnType<typeof createBrowserRouter>, 'navigate' | 'state'>,
  queryClient: QueryClient,
): () => void {
  return onUnauthorized(() => {
    queryClient.clear();
    if (router.state.location.pathname !== '/login')
      void router.navigate('/login', { replace: true });
  });
}
