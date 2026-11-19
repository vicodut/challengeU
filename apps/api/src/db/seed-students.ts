import { type ListPrograms, type RegisterStudent } from '../modules/enrollment';
import { UsernameTakenError } from '../modules/identity';
import { SEED_USERS } from './seed-users';

// Seed enrollments, as listed in spec #1 "Persistence": username -> program name.
const SEED_ENROLLMENTS: Record<string, string> = {
  studentA: 'Academic Success',
  studentB: 'Career Launch',
};

/** Registers the seed students through the real use case; existing ones are skipped. */
export async function seedStudents(
  listPrograms: ListPrograms,
  registerStudent: RegisterStudent,
): Promise<void> {
  const programs = await listPrograms.execute();
  for (const { username, password, displayName, timeZone } of SEED_USERS.filter(
    ({ role }) => role === 'student',
  )) {
    const program = programs.find((p) => p.name === SEED_ENROLLMENTS[username]);
    if (!program) continue;
    try {
      await registerStudent.execute({
        username,
        password,
        displayName,
        timeZone,
        programId: program.id,
      });
    } catch (error) {
      if (!(error instanceof UsernameTakenError)) throw error;
    }
  }
}
