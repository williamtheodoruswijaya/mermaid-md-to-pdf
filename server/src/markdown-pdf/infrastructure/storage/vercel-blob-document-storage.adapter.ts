import type { DocumentStoragePort } from '../../application/ports/document-storage.port';
import type { PdfResult } from '../../domain/entities/pdf-result.entity';

export class VercelBlobDocumentStorageAdapter implements DocumentStoragePort {
  async save(result: PdfResult): Promise<void> {
    void result;
    throw new Error(
      'Vercel Blob storage is not configured. Bind this adapter after adding Blob credentials.',
    );
  }
}
