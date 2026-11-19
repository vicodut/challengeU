import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PROBLEM_CONTENT_TYPE, ProblemDetails } from './problem-details';

const DESCRIPTIONS: Record<number, string> = {
  401: 'Missing or invalid credentials',
  403: 'The role is not allowed to do this',
  404: 'Not found (or not owned by the caller)',
  409: 'Conflict with the current state',
  422: 'Validation failed or a business rule was violated',
  503: 'A dependency is unavailable',
};

/** Documents error statuses as RFC 9457 Problem Details responses in the OpenAPI spec. */
export function ApiProblemResponses(...statuses: number[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiExtraModels(ProblemDetails),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: DESCRIPTIONS[status] ?? 'Error',
        content: {
          [PROBLEM_CONTENT_TYPE]: { schema: { $ref: getSchemaPath(ProblemDetails) } },
        },
      }),
    ),
  );
}
