import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Providers, queryClient } from '@/app/providers';
import { router } from '@/app/routes';
import { redirectToLoginOnUnauthorized } from '@/app/unauthorized-redirect';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

redirectToLoginOnUnauthorized(router, queryClient);

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
