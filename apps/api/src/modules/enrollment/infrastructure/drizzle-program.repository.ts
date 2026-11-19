import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { ProgramRepository } from '../application/ports';
import { ProgramNameTakenError } from '../domain/errors';
import type { Program } from '../domain/program';
import { DRIZZLE, type Database } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/pg-errors';
import { programCoaches, programs } from './schema';

@Injectable()
export class DrizzleProgramRepository implements ProgramRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByName(name: string): Promise<Program | null> {
    const [row] = await this.db.select().from(programs).where(eq(programs.name, name));
    return row ?? null;
  }

  async findById(id: string): Promise<Program | null> {
    const [row] = await this.db.select().from(programs).where(eq(programs.id, id));
    return row ?? null;
  }

  async coachIds(programId: string): Promise<string[]> {
    const rows = await this.db
      .select({ coachId: programCoaches.coachId })
      .from(programCoaches)
      .where(eq(programCoaches.programId, programId));
    return rows.map((row) => row.coachId);
  }

  async addCoach(programId: string, coachId: string): Promise<void> {
    await this.db.insert(programCoaches).values({ programId, coachId }).onConflictDoNothing();
  }

  list(): Promise<Program[]> {
    return this.db.select().from(programs).orderBy(asc(programs.name));
  }

  async add(program: Program): Promise<void> {
    try {
      await this.db.insert(programs).values(program);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ProgramNameTakenError(program.name);
      throw error;
    }
  }
}
