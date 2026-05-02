import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from '../../markdown-pdf/application/errors/application-error';
import { DomainError } from '../../markdown-pdf/domain/errors/domain-error';

type ErrorDetails = Record<string, unknown> | undefined;

interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: ErrorDetails;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = this.resolveStatus(exception);
    const body = this.resolveBody(exception);

    response.status(status).json(body);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof ApplicationError) {
      return exception.statusCode;
    }

    if (exception instanceof DomainError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ApplicationError) {
      return {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof DomainError) {
      return {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      return {
        code: 'HTTP_ERROR',
        message: extractHttpExceptionMessage(payload),
        details:
          typeof payload === 'object' && payload !== null
            ? (payload as Record<string, unknown>)
            : undefined,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Unexpected server error.'
          : extractUnknownErrorMessage(exception),
    };
  }
}

function extractHttpExceptionMessage(payload: string | object): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if ('message' in payload) {
    const message = (payload as { readonly message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Request failed.';
}

function extractUnknownErrorMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message;
  }

  return 'Unexpected server error.';
}
