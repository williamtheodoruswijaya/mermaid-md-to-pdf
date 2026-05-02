import { DomainError } from '../errors/domain-error';

export class DiagramBlock {
  constructor(
    readonly id: string,
    readonly source: string,
  ) {
    if (!id.trim()) {
      throw new DomainError('DIAGRAM_ID_REQUIRED', 'Diagram ID is required.');
    }

    if (!source.trim()) {
      throw new DomainError(
        'DIAGRAM_SOURCE_REQUIRED',
        'Mermaid diagram source is required.',
      );
    }
  }
}
