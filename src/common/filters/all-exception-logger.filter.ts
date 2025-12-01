import { ExceptionFilter, Catch, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionLoggerFilter');

  catch(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception caught: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unhandled exception caught: Unknown error', exception);
    }
  }
}
