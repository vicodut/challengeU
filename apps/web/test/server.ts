import { setupServer } from 'msw/node';

/** Shared MSW server. Tests register handlers with `server.use(...)`. */
export const server = setupServer();
