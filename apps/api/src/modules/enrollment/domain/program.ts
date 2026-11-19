import { InvalidProgramNameError } from './errors';

export interface Program {
  id: string;
  name: string;
}

export const MAX_PROGRAM_NAME_LENGTH = 100;

/** Builds a program, enforcing the domain rule that the trimmed name is 1 to 100 characters. */
export function createProgram(id: string, name: string): Program {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PROGRAM_NAME_LENGTH) {
    throw new InvalidProgramNameError();
  }
  return { id, name: trimmed };
}
