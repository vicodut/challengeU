export const ROLES = ['student', 'coach', 'admin'] as const;

export type Role = (typeof ROLES)[number];
