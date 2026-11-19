export interface BasicCredentials {
  username: string;
  password: string;
}

/** Parses an `Authorization: Basic base64(username:password)` header; null if absent or malformed. */
export function parseBasicAuthorization(header: string | undefined): BasicCredentials | null {
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header?.trim() ?? '');
  if (!match?.[1]) return null;
  const decoded = Buffer.from(match[1], 'base64').toString('utf8');
  const separator = decoded.indexOf(':'); // the password may itself contain ':'
  if (separator <= 0) return null;
  return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
}
