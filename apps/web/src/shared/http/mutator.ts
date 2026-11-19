// Custom fetch mutator used by every Orval-generated call. It adds the Basic auth
// header (credentials live in sessionStorage) and returns Orval's `{ data, status, headers }`.
export const CREDENTIALS_STORAGE_KEY = 'challengeu.credentials';

function authorizationHeader(): Record<string, string> {
  try {
    const credentials = globalThis.sessionStorage.getItem(CREDENTIALS_STORAGE_KEY);
    return credentials ? { Authorization: `Basic ${credentials}` } : {};
  } catch {
    return {}; // no sessionStorage (tests, privacy modes)
  }
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
  const text = [204, 205, 304].includes(response.status) ? '' : await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  return { data, status: response.status, headers: response.headers } as T;
};
