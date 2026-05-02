import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApplication } from './../src/bootstrap';

describe('MarkdownPdfController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/markdown-pdf/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/markdown-pdf/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/markdown-pdf/inspect (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/markdown-pdf/inspect')
      .send({
        markdown:
          '# Title\n\n| A | B |\n| --- | --- |\n| One | Two |\n\n```mermaid\ngraph TD\nA-->B\n```',
      })
      .expect(201);

    expect(response.body.metadata.headingCount).toBe(1);
    expect(response.body.metadata.tableCount).toBe(1);
    expect(response.body.metadata.diagramCount).toBe(1);
  });

  it('/markdown-pdf/preview (POST) sanitizes HTML-like input', async () => {
    const response = await request(app.getHttpServer())
      .post('/markdown-pdf/preview')
      .send({
        markdown: '# Safe\n\n<script>alert("xss")</script>',
        options: {
          renderMermaid: false,
        },
      })
      .expect(201);

    expect(response.body.html).not.toContain('<script>');
    expect(response.body.html).toContain('<h1>');
  });
});
