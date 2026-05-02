export class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> | undefined = undefined,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
