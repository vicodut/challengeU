import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { Roles } from '../../src/modules/identity';
import { Public } from '../../src/shared/auth/public.decorator';

class EchoBody {
  @IsString()
  @MinLength(3)
  name!: string;
}

/**
 * Routes that exist only in the test app (registered by createTestApp): they exercise the
 * guard and the error contract without shipping in production or in the OpenAPI spec.
 */
@ApiExcludeController()
@Controller('test')
export class TestRoutesController {
  @Get('admin-only')
  @Roles('admin')
  adminOnly(): { ok: true } {
    return { ok: true };
  }

  @Get('coach-or-student')
  @Roles('coach', 'student')
  coachOrStudent(): { ok: true } {
    return { ok: true };
  }

  @Get('public')
  @Public()
  open(): { ok: true } {
    return { ok: true };
  }

  @Get('boom')
  @Public()
  boom(): never {
    throw new Error('secret internal detail');
  }

  @Post('echo')
  @Public()
  echo(@Body() body: EchoBody): EchoBody {
    return body;
  }
}
