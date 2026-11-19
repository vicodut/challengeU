import type { QueryClient } from '@tanstack/react-query';
import type { createBrowserRouter } from 'react-router';
import { onUnauthorized } from '@/shared/auth/session';
import { LOGIN_PATH } from '@/shared/routes/paths';

/** Ending the session (logout, or any 401; credentials already cleared) empties the cache and sends the user to /login. */
export function redirectToLoginOnUnauthorized(
  router: Pick<ReturnType<typeof createBrowserRouter>, 'navigate' | 'state'>,
  queryClient: QueryClient,
): () => void {
  return onUnauthorized(() => {
    queryClient.clear();
    if (router.state.location.pathname !== LOGIN_PATH)
      void router.navigate(LOGIN_PATH, { replace: true });
  });
}
