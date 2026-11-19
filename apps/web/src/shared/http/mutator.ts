// Custom fetch mutator used by every Orval-generated call. It adds the Basic auth
// header (credentials live in sessionStorage, see shared/auth) and returns Orval's
// `{ data, status, headers }`. Any 401 clears the credentials and triggers the login redirect.
import { basicAuthorization, endSession, getCredentials } from '@/shared/auth/session';

const candidateKey = Symbol('candidateCredentials');

/**
 * Request options that make the mutator authenticate with candidate credentials (a login
 * attempt) instead of the stored ones. A 401 for such a probe does not end the session.
 */
export function candidateCredentials(credentials: string): RequestInit {
  return { [candidateKey]: credentials } as RequestInit;
}

function authorizationHeader(candidate: string | undefined): Record<string, string> {
  const credentials = candidate ?? getCredentials();
  return credentials ? { Authorization: basicAuthorization(credentials) } : {};
}

// Browsers resolve relative URLs themselves; outside a browser (tests) anchor them to localhost.
function resolveUrl(url: string): string {
  return 'location' in globalThis ? url : new URL(url, 'http://localhost').toString();
}

export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const candidate = (options as Record<symbol, string | undefined>)[candidateKey];
  const response = await fetch(resolveUrl(url), {
    ...options,
    headers: { ...authorizationHeader(candidate), ...(options.headers as Record<string, string>) },
  });
  if (response.status === 401 && candidate === undefined) endSession();
  const text = [204, 205, 304].includes(response.status) ? '' : await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined; // non-JSON body (e.g. an HTML 502 from a proxy): the status still tells the story
  }
  return { data, status: response.status, headers: response.headers } as T;
};
