import { DomainError } from '../errors/domain-error';

export class SanitizedHtml {
  constructor(readonly value: string) {
    if (!value.trim()) {
      throw new DomainError(
        'EMPTY_SANITIZED_HTML',
        'Rendered HTML cannot be empty.',
      );
    }
  }
}
