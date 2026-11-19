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

export type BookingEligibility = 'allowed' | 'suspended' | 'coach_not_in_program';

/** Whether a student may book a coach: the coach must belong to the student's program, and the enrollment must be active. */
export function bookingEligibility(
  enrollment: Enrollment | null,
  programCoachIds: string[],
  coachId: string,
): BookingEligibility {
  if (!enrollment || !programCoachIds.includes(coachId)) return 'coach_not_in_program';
  return enrollment.status === 'suspended' ? 'suspended' : 'allowed';
}
