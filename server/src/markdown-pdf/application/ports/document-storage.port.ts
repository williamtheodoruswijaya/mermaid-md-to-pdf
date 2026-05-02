import type { PdfResult } from '../../domain/entities/pdf-result.entity';

export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');

export interface DocumentStoragePort {
  save(result: PdfResult): Promise<void>;
}
