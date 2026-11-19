import type { AssignCoach, ListPrograms } from '../modules/enrollment';
import type { ProfileDirectory } from '../modules/identity';

// Seed assignments, as listed in spec #1 "Persistence": program name -> coach display names.
const SEED_PROGRAM_COACHES: Record<string, string[]> = {
  'Academic Success': ['Coach A', 'Coach B'],
  'Career Launch': ['Coach B'],
};

/** Assigns the seed coaches through the real use case; assigning twice is a no-op. */
export async function seedProgramCoaches(
  listPrograms: ListPrograms,
  assignCoach: AssignCoach,
  profiles: ProfileDirectory,
): Promise<void> {
  const programs = await listPrograms.execute();
  const coaches = await profiles.listCoaches();
  for (const [programName, coachNames] of Object.entries(SEED_PROGRAM_COACHES)) {
    const program = programs.find((p) => p.name === programName);
    for (const coachName of coachNames) {
      const coach = coaches.find((c) => c.displayName === coachName);
      if (program && coach) await assignCoach.execute(program.id, coach.id);
    }
  }
}
