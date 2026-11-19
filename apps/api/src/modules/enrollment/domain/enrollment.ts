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
