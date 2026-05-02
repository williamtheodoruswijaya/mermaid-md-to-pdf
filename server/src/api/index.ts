import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from '../app.module';
import { configureApplication } from '../bootstrap';

const expressServer = express();
let bootstrapPromise: Promise<void> | null = null;

async function bootstrapServer(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
    {
      bodyParser: true,
    },
  );

  configureApplication(app);
  await app.init();
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  bootstrapPromise ??= bootstrapServer();
  await bootstrapPromise;
  expressServer(request, response);
}
