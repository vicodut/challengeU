// Custom fetch mutator used by every Orval-generated call. It adds the Basic auth
// header (credentials live in sessionStorage, see shared/auth) and returns Orval's
// `{ data, status, headers }`. Any 401 clears the credentials and triggers the login redirect.
import { basicAuthorization, getCredentials, handleUnauthorized } from '@/shared/auth/session';

function authorizationHeader(): Record<string, string> {
  const credentials = getCredentials();
  return credentials ? { Authorization: basicAuthorization(credentials) } : {};
}

// Browsers resolve relative URLs themselves; outside a browser (tests) anchor them to localhost.
function resolveUrl(url: string): string {
  return 'location' in globalThis ? url : new URL(url, 'http://localhost').toString();
}

export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(resolveUrl(url), {
    ...options,
    headers: { ...authorizationHeader(), ...(options.headers as Record<string, string>) },
  });
  if (response.status === 401) handleUnauthorized();
  const text = [204, 205, 304].includes(response.status) ? '' : await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
};
