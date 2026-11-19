import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../../identity';
import type { StudentView } from './get-student';
import { ENROLLMENT_REPOSITORY, type EnrollmentRepository } from './ports';

@Injectable()
export class ListStudents {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async execute(): Promise<StudentView[]> {
    const enrollments = await this.enrollments.list();
    const profiles = new Map(
      (await this.profiles.findByIds(enrollments.map((e) => e.studentId))).map((p) => [p.id, p]),
    );
    return enrollments
      .flatMap((enrollment) => {
        const profile = profiles.get(enrollment.studentId);
        return profile
          ? [{ ...enrollment, displayName: profile.displayName, timeZone: profile.timeZone }]
          : [];
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}
