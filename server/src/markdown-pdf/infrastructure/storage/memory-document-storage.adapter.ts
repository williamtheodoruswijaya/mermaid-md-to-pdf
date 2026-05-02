import type { DocumentStoragePort } from '../../application/ports/document-storage.port';
import type { PdfResult } from '../../domain/entities/pdf-result.entity';

export class MemoryDocumentStorageAdapter implements DocumentStoragePort {
  private readonly results = new Map<string, PdfResult>();

  async save(result: PdfResult): Promise<void> {
    this.results.set(result.filename, result);
  }
}
