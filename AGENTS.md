# AGENTS.md

## Project Mission

Build a Markdown-to-PDF web application that can convert Markdown into a clean PDF while preserving diagrams and images.

The repository uses:

- **Backend:** NestJS, designed to run as a Vercel serverless API.
- **Frontend:** Next.js, designed to run on Vercel.
- **Architecture:** Clean Architecture, inspired by the `server` structure in FoodHunt: feature modules, controllers, services/use cases, repository/provider interfaces, and infrastructure adapters.

The application must support normal Markdown, tables, code blocks, Mermaid diagrams, local/uploaded images, and safe remote images.

---

## Repository Layout

Use this monorepo layout:

```txt
markdown-to-pdf/
├── client/                         # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── features/
│   │   └── markdown-pdf/
│   ├── lib/
│   └── package.json
│
├── server/                         # NestJS backend
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts             # Vercel serverless entrypoint
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── middleware/
│   │   │   └── model/
│   │   ├── markdown-pdf/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── value-objects/
│   │   │   │   └── errors/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   ├── ports/
│   │   │   │   └── dto/
│   │   │   ├── infrastructure/
│   │   │   │   ├── markdown/
│   │   │   │   ├── diagram/
│   │   │   │   ├── pdf/
│   │   │   │   ├── image/
│   │   │   │   └── storage/
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   └── dto/
│   │   │   └── markdown-pdf.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── vercel.json
│   └── package.json
│
├── AGENTS.md
├── SKILL.md
├── GETTING_STARTED.md
└── CONTRIBUTING.md
```

---

## Clean Architecture Rules

### Dependency Direction

Dependencies must point inward:

```txt
presentation -> application -> domain
infrastructure -> application/domain
```

Rules:

1. `domain` must not import NestJS, Express, Puppeteer, Vercel, filesystem APIs, HTTP clients, or database clients.
2. `application` may depend on domain and application ports only.
3. `presentation` translates HTTP requests into use-case input DTOs.
4. `infrastructure` implements ports such as `PdfRendererPort`, `DiagramRendererPort`, `ImageResolverPort`, and `DocumentStoragePort`.
5. NestJS modules wire dependencies using provider tokens. Keep this similar to the FoodHunt server style where modules provide interfaces/tokens and bind them to concrete implementation classes.

---

## Backend Feature Design

The main backend feature is `markdown-pdf`.

### Domain Layer

Recommended objects:

```txt
domain/entities/
├── markdown-document.entity.ts
├── render-job.entity.ts
└── pdf-result.entity.ts

domain/value-objects/
├── document-asset.vo.ts
├── render-options.vo.ts
├── diagram-block.vo.ts
└── sanitized-html.vo.ts
```

Domain responsibilities:

- Represent the Markdown document.
- Represent images/assets attached to a document.
- Validate render options such as page size, margin, theme, timeout, and image policy.
- Expose business invariants, not infrastructure behavior.

Do not place Markdown parser code, PDF renderer code, or Vercel-specific logic in domain.

### Application Layer

Recommended use cases:

```txt
application/use-cases/
├── render-markdown-to-pdf.use-case.ts
├── preview-markdown-html.use-case.ts
├── validate-markdown-assets.use-case.ts
└── inspect-markdown-document.use-case.ts
```

Recommended ports:

```txt
application/ports/
├── markdown-parser.port.ts
├── html-sanitizer.port.ts
├── diagram-renderer.port.ts
├── image-resolver.port.ts
├── pdf-renderer.port.ts
└── document-storage.port.ts
```

Application responsibilities:

1. Receive Markdown, render options, and assets.
2. Parse Markdown into an intermediate representation.
3. Render Mermaid blocks into SVG/PNG through `DiagramRendererPort`.
4. Resolve image references through `ImageResolverPort`.
5. Sanitize generated HTML.
6. Render final HTML into PDF through `PdfRendererPort`.
7. Return a `PdfResult` with filename, bytes, content type, and metadata.

### Infrastructure Layer

Recommended adapters:

```txt
infrastructure/markdown/
├── remark-markdown-parser.adapter.ts
└── markdown-html-renderer.adapter.ts

infrastructure/diagram/
├── mermaid-svg-renderer.adapter.ts
└── noop-diagram-renderer.adapter.ts

infrastructure/image/
├── safe-remote-image-resolver.adapter.ts
├── uploaded-image-resolver.adapter.ts
└── image-policy.validator.ts

infrastructure/pdf/
├── chromium-pdf-renderer.adapter.ts
└── pdf-rendering-options.mapper.ts

infrastructure/storage/
├── memory-document-storage.adapter.ts
└── vercel-blob-document-storage.adapter.ts
```

Infrastructure responsibilities:

- Use `unified`, `remark`, `rehype`, `mermaid`, `puppeteer-core`, `@sparticuz/chromium`, or other concrete libraries.
- Hide library details from the application layer.
- Keep all Vercel/serverless-specific constraints here.

### Presentation Layer

Recommended endpoints:

```txt
POST /markdown-pdf/render
POST /markdown-pdf/preview
POST /markdown-pdf/inspect
```

Presentation responsibilities:

- Validate request DTOs with `class-validator`.
- Convert multipart/form-data or JSON payloads into use-case inputs.
- Return PDF bytes with `Content-Type: application/pdf`.
- Return structured error responses.

---

## Vercel Runtime Rules

The backend must be deployable to Vercel.

1. Use `server/src/api/index.ts` as the Vercel entrypoint.
2. Use `vercel.json` to route all requests to the serverless handler.
3. Do not rely on persistent local disk. Use memory, `/tmp`, or Vercel Blob/S3-like storage.
4. Keep rendering synchronous only for small documents. For large documents, introduce a job model later.
5. Avoid CLI-only rendering paths in production. Prefer library adapters.
6. When using Chromium, prefer `puppeteer-core` with `@sparticuz/chromium` for serverless compatibility.
7. Do not execute untrusted Markdown through shell commands.

---

## Image and Mermaid Handling Rules

### Markdown Images

Support these image forms:

```md
![alt](attachment://diagram.png)
![alt](https://example.com/safe-image.png)
![alt](data:image/png;base64,...)
```

Rules:

- Uploaded images must be mapped by asset ID or filename.
- Remote images must pass SSRF protection.
- Data URLs must have strict size limits.
- MIME type must be checked using file signature, not only filename.
- Missing images must produce a clear validation error before rendering.

### Mermaid Blocks

Convert this:

````md
```mermaid
graph TD
  A --> B
```
````

Into a safe rendered SVG/PNG before generating the PDF.

Do not leave Mermaid blocks as plain code in the final PDF unless the user chooses `renderMermaid: false`.

---

## Security Rules

This project accepts user-provided Markdown, HTML-like content, and image references. Treat every input as untrusted.

Mandatory rules:

1. Sanitize generated HTML.
2. Disable JavaScript inside rendered HTML unless absolutely required by a controlled adapter.
3. Block `file://`, private IPs, metadata IPs, localhost, and internal network URLs for remote images.
4. Enforce max Markdown size, max image count, max image size, max render time, and max output PDF size.
5. Never pass raw user input into shell commands.
6. Never expose stack traces in production responses.
7. Keep default CORS restrictive. Use `*` only in local development.
8. Add rate limiting to render endpoints.

---

## Coding Style

### TypeScript

- Use strict typing.
- Avoid `any`. Use unknown and narrow it.
- Prefer readonly DTOs where possible.
- Keep function names business-oriented.
- Keep adapters replaceable.
- Use explicit return types for public methods.

### NestJS

- Controllers should be thin.
- Use cases should contain orchestration logic.
- Repositories/adapters should contain I/O logic.
- Modules should bind tokens to implementations.
- Use global `ValidationPipe` with whitelist and transform enabled.

### Frontend

- Keep upload, editor, preview, and export concerns separated.
- Do not duplicate backend render rules in the UI.
- The frontend may preview Markdown, but the backend is the source of truth for final PDF generation.

---

## Testing Requirements

Backend:

```txt
Domain tests       -> pure unit tests
Use-case tests     -> mocked ports
Adapter tests      -> real parser/renderer where possible
Controller tests   -> request/response validation
E2E tests          -> render known Markdown fixtures to PDF
```

Frontend:

```txt
Component tests    -> editor/upload/render controls
Feature tests      -> user flow from Markdown input to PDF download
API tests          -> client adapter contract
```

Fixtures must include:

- Markdown headings and paragraphs.
- Tables.
- Code blocks.
- Mermaid diagram.
- Uploaded local image.
- Remote image blocked by policy.
- Large document rejected by validation.

---

## Pull Request Checklist

Before marking work as done:

- [ ] Code follows Clean Architecture dependency direction.
- [ ] No domain code imports framework or infrastructure packages.
- [ ] Controllers remain thin.
- [ ] Ports are defined before adapters are created.
- [ ] User input is validated and sanitized.
- [ ] Markdown with images renders correctly.
- [ ] Mermaid blocks render as diagrams in the PDF.
- [ ] Vercel serverless constraints are respected.
- [ ] Tests are added or updated.
- [ ] `npm run lint`, `npm run test`, and `npm run build` pass for touched workspace(s).

---

## Do Not Do This

- Do not put Puppeteer calls directly in controllers.
- Do not parse Markdown inside controllers.
- Do not create a God service that handles validation, parsing, diagram rendering, image fetching, and PDF generation in one class.
- Do not store uploaded files permanently on local disk in Vercel.
- Do not allow arbitrary remote image fetching without network protections.
- Do not use `strict: false` style shortcuts in security-sensitive validation.
