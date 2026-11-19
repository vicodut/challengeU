import { applyDecorators, type Type as ClassType } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { DomainError } from '../errors/domain-error';

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;

/** `?limit=&cursor=` for every time-ordered list. */
export class PageQuery {
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE_LIMIT, default: DEFAULT_PAGE_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  @ApiPropertyOptional({ description: 'Opaque; the `nextCursor` of the previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class InvalidCursorError extends Error implements DomainError {
  readonly code = 'INVALID_CURSOR';
  readonly kind = 'unprocessable' as const;
  constructor() {
    super('The cursor is not valid');
  }
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Cursor = base64url of the last item's sort key (an instant) and its id. */
export function encodeCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify([at.toISOString(), id])).toString('base64url');
}

export function decodeCursor(cursor: string): { at: Date; id: string } {
  try {
    const [at, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as [string, string];
    const date = new Date(at);
    if (typeof id !== 'string' || Number.isNaN(date.getTime())) throw new Error();
    return { at: date, id };
  } catch {
    throw new InvalidCursorError();
  }
}

/** Turns `limit + 1` fetched rows into a page. */
export function toPage<T>(
  rows: T[],
  limit: number,
  key: (row: T) => { at: Date; id: string },
): Page<T> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const more = rows.length > limit && last !== undefined;
  return { items, nextCursor: more ? encodeCursor(key(last).at, key(last).id) : null };
}

/** Documents `{ items: Model[], nextCursor }` as the 200 response. */
export function ApiPageResponse(model: ClassType<unknown>): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        required: ['items', 'nextCursor'],
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          nextCursor: { type: 'string', nullable: true },
        },
      },
    }),
  );
}
