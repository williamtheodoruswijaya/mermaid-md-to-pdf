# CONTRIBUTING.md

## Contribution Philosophy

This repository prioritizes:

1. Clean Architecture.
2. Safe rendering of untrusted Markdown.
3. Reliable PDF output.
4. Vercel-compatible deployment.
5. Clear tests for every rendering behavior.

Do not optimize for quick hacks that make future rendering or security harder to maintain.

---

## Branch Naming

Use short, descriptive branch names:

```txt
feature/markdown-render-use-case
feature/mermaid-svg-renderer
feature/uploaded-image-resolver
fix/pdf-render-timeout
fix/remote-image-ssrf-policy
chore/update-render-fixtures
```

---

## Commit Format

Use Conventional Commits:

```txt
feat: add markdown to pdf render use case
fix: block localhost remote image URLs
test: add mermaid render fixture
refactor: extract pdf renderer port
chore: update vercel config
```

Allowed types:

```txt
feat
fix
test
refactor
chore
docs
style
perf
ci
build
```

---

## Pull Request Requirements

Every PR must include:

- What changed.
- Why it changed.
- How it was tested.
- Screenshots or generated PDF sample when UI/rendering changes.
- Notes about Vercel/serverless impact when backend rendering changes.

PR checklist:

- [ ] The change follows Clean Architecture dependency direction.
- [ ] No domain object imports NestJS, Express, Puppeteer, Vercel, filesystem, or HTTP client packages.
- [ ] Controllers are thin.
- [ ] Use cases depend on ports, not concrete infrastructure.
- [ ] Infrastructure adapters implement ports.
- [ ] User input is validated.
- [ ] HTML is sanitized.
- [ ] Image fetching policy is respected.
- [ ] Mermaid rendering failure is handled safely.
- [ ] Tests are added or updated.
- [ ] Local build passes.

---

## Architecture Rules

### Domain Layer

Allowed:

- Entities.
- Value objects.
- Domain errors.
- Pure validation logic.
- Business invariants.

Not allowed:

- NestJS decorators.
- HTTP request/response types.
- Puppeteer.
- Mermaid library calls.
- File system operations.
- Network calls.

### Application Layer

Allowed:

- Use cases.
- Port interfaces.
- DTOs internal to use cases.
- Orchestration logic.

Not allowed:

- Direct Puppeteer calls.
- Direct remote image fetching.
- Direct filesystem persistence unless abstracted behind a port.
- Framework-specific request handling.

### Infrastructure Layer

Allowed:

- Markdown parser libraries.
- HTML sanitizer libraries.
- Mermaid renderer libraries.
- PDF renderer libraries.
- Storage clients.
- HTTP clients for safe remote image fetching.

Not allowed:

- Business orchestration that belongs in use cases.
- HTTP response formatting that belongs in controllers.

### Presentation Layer

Allowed:

- Controllers.
- Request DTOs.
- Response DTOs.
- Guards, pipes, interceptors.

Not allowed:

- PDF rendering logic.
- Markdown parsing logic.
- Image fetching logic.
- Mermaid rendering logic.

---

## Backend Coding Standards

### Provider Tokens

Use provider tokens for application ports and services.

Example:

```ts
export const PDF_RENDERER = Symbol('PDF_RENDERER');
export const DIAGRAM_RENDERER = Symbol('DIAGRAM_RENDERER');
export const IMAGE_RESOLVER = Symbol('IMAGE_RESOLVER');
```

Module binding example:

```ts
@Module({
  controllers: [MarkdownPdfController],
  providers: [
    RenderMarkdownToPdfUseCase,
    { provide: PDF_RENDERER, useClass: ChromiumPdfRendererAdapter },
    { provide: DIAGRAM_RENDERER, useClass: MermaidSvgRendererAdapter },
    { provide: IMAGE_RESOLVER, useClass: SafeImageResolverAdapter },
  ],
})
export class MarkdownPdfModule {}
```

### DTO Validation

Use `class-validator` for request DTOs.

Example:

```ts
export class RenderMarkdownRequestDto {
  @IsString()
  @MinLength(1)
  markdown!: string;

  @ValidateNested()
  @Type(() => RenderOptionsDto)
  options!: RenderOptionsDto;
}
```

### Error Response

Use consistent error shape:

```json
{
  "code": "PDF_RENDER_FAILED",
  "message": "Failed to render PDF.",
  "details": {}
}
```

Do not expose raw stack traces in production.

---

## Frontend Coding Standards

Recommended feature layout:

```txt
client/features/markdown-pdf/
├── api/
│   └── markdown-pdf.client.ts
├── components/
│   ├── markdown-editor.tsx
│   ├── asset-uploader.tsx
│   ├── render-options-panel.tsx
│   ├── preview-panel.tsx
│   └── pdf-download-button.tsx
├── hooks/
│   └── use-markdown-pdf-render.ts
├── schemas/
│   └── render-options.schema.ts
└── types/
    └── markdown-pdf.types.ts
```

Rules:

- Keep API calls in `api/`.
- Keep validation schemas in `schemas/`.
- Keep components small.
- The UI can preview Markdown, but final PDF generation must use the backend.
- Show user-friendly errors for blocked images, unsupported files, and render timeouts.

---

## Security Requirements

This project processes untrusted content.

All contributors must protect against:

- XSS through raw HTML in Markdown.
- SSRF through remote image URLs.
- Local file leakage through `file://` paths.
- Serverless timeout abuse through huge diagrams or documents.
- Memory exhaustion through large images.
- Shell injection through renderer commands.

Mandatory controls:

```txt
Max markdown size
Max image size
Max image count
Allowed MIME types
Remote image URL policy
HTML sanitizer
Render timeout
Temporary file cleanup
Rate limit
```

---

## Testing Guidelines

### Unit Tests

Use unit tests for:

- Domain validation.
- Render options.
- Asset reference parsing.
- Use-case orchestration with mocked ports.

### Integration Tests

Use integration tests for:

- Markdown parser adapter.
- HTML sanitizer adapter.
- Mermaid renderer adapter.
- Image resolver adapter.
- PDF renderer adapter.

### E2E Tests

Use E2E tests for:

- `POST /markdown-pdf/render` returns PDF.
- `POST /markdown-pdf/preview` returns sanitized HTML.
- Invalid image references return structured errors.
- Blocked remote URLs are rejected.

### Fixture Tests

Create fixture cases under:

```txt
server/test/fixtures/markdown-pdf/
```

Each fixture must document expected behavior.

---

## Local Quality Commands

From `server/`:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

From `client/`:

```bash
npm run lint
npm run build
```

---

## PDF Review Checklist

For rendering-related PRs, generate at least one sample PDF and verify:

- [ ] Headings are readable.
- [ ] Tables fit page width.
- [ ] Code blocks do not overflow.
- [ ] Uploaded images are visible.
- [ ] Mermaid diagrams are visible.
- [ ] Unsafe HTML is removed.
- [ ] Remote image policy works.
- [ ] PDF has correct filename and content type.

---

## Adding a New Renderer Adapter

When adding a new renderer:

1. Define or reuse a port in `application/ports`.
2. Implement the adapter in `infrastructure`.
3. Bind the adapter in the NestJS module.
4. Add adapter-specific tests.
5. Add at least one E2E test proving the renderer works through the HTTP endpoint.
6. Document Vercel compatibility and limitations.

---

## Review Notes for Maintainers

Reject PRs when:

- The controller directly renders PDF.
- Untrusted URLs can be fetched without policy checks.
- Raw HTML is passed to Chromium without sanitization.
- Domain layer imports framework/infrastructure packages.
- A feature works only locally but not on Vercel.
- Tests do not cover new rendering behavior.
