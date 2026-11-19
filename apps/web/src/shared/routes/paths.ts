// Route paths used by more than one module.
export const LOGIN_PATH = '/login';
export const HOME_PATH = '/home';
/** The role's own section, e.g. `/student`. Users may only open their own. */
export const rolePath = (role: string) => `/${role}`;
