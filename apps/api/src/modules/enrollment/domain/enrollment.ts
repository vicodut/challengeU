import { EmptyUpdateError } from './errors';

export const ENROLLMENT_STATUSES = ['active', 'suspended'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface Enrollment {
  studentId: string;
  programId: string;
  status: EnrollmentStatus;
  statusChangedAt: Date;
}

/** A new enrollment is always active. */
export function enroll(studentId: string, programId: string, now: Date): Enrollment {
  return { studentId, programId, status: 'active', statusChangedAt: now };
}

export interface EnrollmentChange {
  programId?: string;
  status?: EnrollmentStatus;
}

/** Applies a partial update; `statusChangedAt` moves only when the status really changes. */
export function change(enrollment: Enrollment, update: EnrollmentChange, now: Date): Enrollment {
  if (update.programId === undefined && update.status === undefined) throw new EmptyUpdateError();
  const status = update.status ?? enrollment.status;
  return {
    ...enrollment,
    programId: update.programId ?? enrollment.programId,
    status,
    statusChangedAt: status === enrollment.status ? enrollment.statusChangedAt : now,
  };
}
