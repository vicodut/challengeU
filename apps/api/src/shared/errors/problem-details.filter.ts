import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { isDomainError, STATUS_BY_KIND } from './domain-error';
import { PROBLEM_CONTENT_TYPE, type ProblemDetails } from './problem-details';
import { ValidationFailedError } from './validation-failed.error';

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

// Codes for errors that are not typed domain errors (framework, routing, parsing).
const CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'INVALID_CREDENTIALS',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

function problem(status: number, code: string, detail: string): ProblemDetails {
  return {
    type: `urn:challengeu:problem:${code.toLowerCase().replaceAll('_', '-')}`,
    title: TITLES[status] ?? 'Error',
    status,
    code,
    detail,
  };
}

function httpStatusOf(error: unknown): number | undefined {
  if (error instanceof HttpException) return error.getStatus();
  // Errors raised by Express middleware, e.g. malformed JSON bodies (http-errors).
  const { status } = error as { status?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export function toProblemDetails(error: unknown): ProblemDetails {
  if (error instanceof ValidationFailedError) {
    return Object.assign(problem(422, error.code, error.message), { errors: error.errors });
  }
  if (isDomainError(error)) {
    return problem(STATUS_BY_KIND[error.kind], error.code, error.message);
  }
  const status = httpStatusOf(error);
  if (status !== undefined) {
    return problem(status, CODES[status] ?? `HTTP_${String(status)}`, messageOf(error));
  }
  return problem(500, CODES[500] ?? 'INTERNAL_ERROR', 'An unexpected error occurred');
}

/** The single place where errors become HTTP responses: always RFC 9457 Problem Details. */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemDetails');

  catch(error: unknown, host: ArgumentsHost): void {
    const body = toProblemDetails(error);
    if (body.status >= 500 && !isDomainError(error)) {
      this.logger.error(messageOf(error), error instanceof Error ? error.stack : undefined);
    }
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(body.status)
      .type(PROBLEM_CONTENT_TYPE)
      .json(body);
  }
}
