export interface MarkdownImageReference {
  readonly markdown: string;
  readonly alt: string;
  readonly url: string;
  readonly title?: string;
}

const imageReferencePattern =
  /!\[([^\]]*)\]\(([^)\s]+)(?:\s+(".*?"|'.*?'))?\)/g;

export function extractMarkdownImageReferences(
  markdown: string,
): readonly MarkdownImageReference[] {
  return Array.from(markdown.matchAll(imageReferencePattern)).map((match) => ({
    markdown: match[0],
    alt: match[1],
    url: match[2],
    title: match[3],
  }));
}

export async function replaceMarkdownImageReferences(
  markdown: string,
  replacer: (reference: MarkdownImageReference) => Promise<string>,
): Promise<string> {
  const references = extractMarkdownImageReferences(markdown);
  let output = markdown;

  for (const reference of references) {
    output = output.replace(reference.markdown, await replacer(reference));
  }

  return output;
}

export function createMarkdownImage(
  alt: string,
  url: string,
  title?: string,
): string {
  return title ? `![${alt}](${url} ${title})` : `![${alt}](${url})`;
}

export interface MermaidBlockMatch {
  readonly markdown: string;
  readonly source: string;
  readonly index: number;
}

export function extractMermaidBlocks(
  markdown: string,
): readonly MermaidBlockMatch[] {
  return Array.from(markdown.matchAll(/```mermaid\s*([\s\S]*?)```/gi)).map(
    (match, index) => ({
      markdown: match[0],
      source: match[1].trim(),
      index,
    }),
  );
}

export async function replaceMermaidBlocks(
  markdown: string,
  replacer: (block: MermaidBlockMatch) => Promise<string>,
): Promise<string> {
  const blocks = extractMermaidBlocks(markdown);
  let output = markdown;

  for (const block of blocks) {
    output = output.replace(block.markdown, await replacer(block));
  }

  return output;
}
