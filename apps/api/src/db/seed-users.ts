import {
  type CreateAccount,
  type CreateAccountInput,
  UsernameTakenError,
} from '../modules/identity';

// Seed users, as listed in spec #1 "Persistence".
// Students are listed here for tests but created by `seedStudents` (account + enrollment).
export const SEED_USERS: readonly CreateAccountInput[] = [
  {
    username: 'admin',
    password: 'admin$123',
    displayName: 'Admin',
    timeZone: 'America/Toronto',
    role: 'admin',
  },
  {
    username: 'coachA',
    password: 'coachA$123',
    displayName: 'Coach A',
    timeZone: 'America/Toronto',
    role: 'coach',
  },
  {
    username: 'coachB',
    password: 'coachB$123',
    displayName: 'Coach B',
    timeZone: 'Europe/Paris',
    role: 'coach',
  },
  {
    username: 'studentA',
    password: 'studentA$123',
    displayName: 'Student A',
    timeZone: 'America/Vancouver',
    role: 'student',
  },
  {
    username: 'studentB',
    password: 'studentB$123',
    displayName: 'Student B',
    timeZone: 'Europe/Paris',
    role: 'student',
  },
];

/** Creates the seed staff accounts through the real account-creation use case; existing ones are skipped. */
export async function seedUsers(createAccount: CreateAccount): Promise<void> {
  for (const user of SEED_USERS.filter(({ role }) => role !== 'student')) {
    try {
      await createAccount.execute(user);
    } catch (error) {
      if (!(error instanceof UsernameTakenError)) throw error;
    }
  }
}
