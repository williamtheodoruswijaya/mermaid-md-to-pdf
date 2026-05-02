import type { MarkdownInspectionDto } from '../dto/markdown-inspection.dto';
import {
  extractMarkdownImageReferences,
  extractMermaidBlocks,
} from './markdown-reference.utils';

export class InspectMarkdownDocumentUseCase {
  execute(markdown: string): MarkdownInspectionDto {
    const imageReferences = extractMarkdownImageReferences(markdown);

    return {
      markdownBytes: new TextEncoder().encode(markdown).byteLength,
      headingCount: countMatches(markdown, /^#{1,6}\s+\S+/gm),
      diagramCount: extractMermaidBlocks(markdown).length,
      imageCount: imageReferences.length,
      tableCount: countMarkdownTables(markdown),
      codeBlockCount: countMatches(markdown, /```[\s\S]*?```/g),
      attachmentImageCount: imageReferences.filter((image) =>
        image.url.startsWith('attachment://'),
      ).length,
      remoteImageCount: imageReferences.filter((image) =>
        /^https?:\/\//i.test(image.url),
      ).length,
      dataImageCount: imageReferences.filter((image) =>
        image.url.startsWith('data:image/'),
      ).length,
    };
  }
}

function countMatches(value: string, pattern: RegExp): number {
  return Array.from(value.matchAll(pattern)).length;
}

function countMarkdownTables(markdown: string): number {
  const lines = markdown.split(/\r?\n/);
  let count = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const previousLine = lines[index - 1];
    const currentLine = lines[index];

    if (
      previousLine.includes('|') &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(currentLine)
    ) {
      count += 1;
    }
  }

  return count;
}
