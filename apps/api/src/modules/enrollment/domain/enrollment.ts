export const ENROLLMENT_STATUSES = ['active', 'suspended'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface Enrollment {
  studentId: string;
  programId: string;
  status: EnrollmentStatus;
  statusChangedAt: Date;
}

/** Changing to the current status is a no-op, so `statusChangedAt` keeps the real change time. */
export function changeStatus(
  enrollment: Enrollment,
  status: EnrollmentStatus,
  now: Date,
): Enrollment {
  return enrollment.status === status
    ? enrollment
    : { ...enrollment, status, statusChangedAt: now };
}

/** A new enrollment is always active. */
export function enroll(studentId: string, programId: string, now: Date): Enrollment {
  return { studentId, programId, status: 'active', statusChangedAt: now };
}
