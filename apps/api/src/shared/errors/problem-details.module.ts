import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import type { ValidationError } from 'class-validator';
import { ProblemDetailsFilter } from './problem-details.filter';
import { type FieldError, ValidationFailedError } from './validation-failed.error';

function flatten(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/** Global error contract: every error is Problem Details, validation failures are 422. */
@Module({
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) => new ValidationFailedError(flatten(errors)),
      }),
    },
  ],
})
export class ProblemDetailsModule {}
