// Credentials live in sessionStorage: they survive a refresh but not closing the tab.
// Every storage access is guarded; without storage the app still renders (you just can't stay
// logged in).
const CREDENTIALS_STORAGE_KEY = 'challengeu.credentials';

/** Base64 of "username:password" (UTF-8), the value that follows `Basic ` in the header. */
export function encodeCredentials(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

export function basicAuthorization(credentials: string): string {
  return `Basic ${credentials}`;
}

export function getCredentials(): string | null {
  try {
    return globalThis.sessionStorage.getItem(CREDENTIALS_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: string): void {
  try {
    globalThis.sessionStorage.setItem(CREDENTIALS_STORAGE_KEY, credentials);
  } catch {
    // storage unavailable: carry on, the session just won't survive a refresh
  }
}

export function clearCredentials(): void {
  try {
    globalThis.sessionStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  } catch {
    // nothing stored, nothing to clear
  }
}

type UnauthorizedListener = () => void;
const listeners = new Set<UnauthorizedListener>();

/** The app shell subscribes here to send the user to /login whenever any request gets a 401. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Called by the fetch mutator on any 401: forget the credentials, then tell the app. */
export function handleUnauthorized(): void {
  clearCredentials();
  listeners.forEach((listener) => {
    listener();
  });
}
