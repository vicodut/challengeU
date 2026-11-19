import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '@/app/routes';
import { i18n, resources } from '@/shared/i18n';

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n', () => {
  it('has exactly the same keys in en and fr', () => {
    const en = keysOf(resources.en.translation).sort();
    const fr = keysOf(resources.fr.translation).sort();
    expect(fr).toEqual(en);
  });

  it('renders the login page in French after switching locale', async () => {
    await i18n.changeLanguage('fr');
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/login'] })} />);

    expect(screen.getByLabelText("Nom d'utilisateur")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
  });
});
