import { type CreateProgram, ProgramNameTakenError } from '../modules/enrollment';

// Seed programs, as listed in spec #1 "Persistence".
export const SEED_PROGRAMS = ['Academic Success', 'Career Launch'] as const;

/** Creates the seed programs through the real use case; existing ones are skipped. */
export async function seedPrograms(createProgram: CreateProgram): Promise<void> {
  for (const name of SEED_PROGRAMS) {
    try {
      await createProgram.execute(name);
    } catch (error) {
      if (!(error instanceof ProgramNameTakenError)) throw error;
    }
  }
}
