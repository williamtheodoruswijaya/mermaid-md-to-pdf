# Markdown PDF Studio

Markdown PDF Studio converts Markdown into PDF while preserving tables, code
blocks, Mermaid diagrams, uploaded images, safe data images, and policy-approved
remote images.

## Apps

- `client/`: Next.js App Router frontend.
- `server/`: NestJS API prepared for Vercel serverless functions.

## Local Setup

Backend:

```bash
cd server
cp .env.example .env
npm install
npm run start:dev
```

Frontend:

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The backend defaults to
`http://localhost:3001`.

## API

- `GET /markdown-pdf/health`
- `POST /markdown-pdf/inspect`
- `POST /markdown-pdf/preview`
- `POST /markdown-pdf/render`

The render endpoint returns `application/pdf` bytes with a download filename.
Uploaded images are sent as JSON assets and referenced from Markdown as
`attachment://filename.png`.

## Vercel Deployment

Deploy as two Vercel projects:

1. Backend project root: `server`
2. Frontend project root: `client`

Backend environment variables:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://mermaid-md-to-pdf.vercel.app
MAX_MARKDOWN_BYTES=1048576
MAX_IMAGE_BYTES=5242880
MAX_IMAGE_COUNT=20
MAX_DIAGRAM_COUNT=20
MAX_PDF_BYTES=15728640
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=20
```

Frontend environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://mermaid-md-to-pdf-server.vercel.app
```

`CLIENT_ORIGIN` must be the frontend origin, not the backend URL. Do not include
a path; a trailing slash is tolerated by the backend, but Vercel's browser
origin will be `https://mermaid-md-to-pdf.vercel.app`.

The backend Vercel entrypoint is `server/src/api/index.ts`, routed by
`server/vercel.json`. Chromium rendering uses `puppeteer-core` with
`@sparticuz/chromium` for serverless compatibility.

## Verification

```bash
cd server
npm run test
npm run test:e2e
npm run build

cd ../client
npm run lint
npm run build
```
