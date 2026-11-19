import { Inject, Injectable } from '@nestjs/common';
import { PROFILE_DIRECTORY, type ProfileDirectory } from '../../identity';
import { StudentNotFoundError } from '../domain/errors';
import { ENROLLMENT_REPOSITORY, type EnrollmentRepository, type EnrollmentView } from './ports';

export interface StudentView extends EnrollmentView {
  displayName: string;
  timeZone: string;
}

@Injectable()
export class GetStudent {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY) private readonly enrollments: EnrollmentRepository,
    @Inject(PROFILE_DIRECTORY) private readonly profiles: ProfileDirectory,
  ) {}

  async execute(studentId: string): Promise<StudentView> {
    const enrollment = await this.enrollments.findByStudentId(studentId);
    const [profile] = enrollment ? await this.profiles.findByIds([studentId]) : [];
    if (!enrollment || !profile) throw new StudentNotFoundError(studentId);
    return { ...enrollment, displayName: profile.displayName, timeZone: profile.timeZone };
  }
}
